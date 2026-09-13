import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import {
  COURSE_CHECKOUT_STALE_MS,
  getStaleCourseCheckoutDecision,
} from "@/lib/course-checkout-reconciliation";
import { releaseConfirmedSessionSeat, releaseSessionSeatHold } from "@/lib/session-seat-inventory";
import { shouldReleaseRecurringSessionSeat } from "@/lib/session-seat-release";

export const runtime = "nodejs";

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const candidates = await prisma.sessionEnrollment.findMany({
    where: {
      paymentStatus: "SUCCESS",
      OR: [{ billingSubscriptionId: { not: null } }, { sourceCheckoutId: { not: null } }],
      accessEndsAt: { lte: now },
      seatReleasedAt: null,
    },
    select: {
      id: true,
      sessionId: true,
      billingSubscriptionId: true,
      sourceCheckoutId: true,
      accessEndsAt: true,
      paymentStatus: true,
    },
  });

  let released = 0;
  for (const enrollment of candidates) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.sessionEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } });
      if (!shouldReleaseRecurringSessionSeat({ ...current, now })) return;

      const checkoutId = current.sourceCheckoutId;
      if (!checkoutId) return;

      const releasedSeat = await releaseConfirmedSessionSeat(tx, {
        checkoutId,
        sessionId: current.sessionId,
        now,
      });
      if (!releasedSeat) return;

      await tx.sessionEnrollment.update({
        where: { id: current.id },
        data: { seatReleasedAt: now },
      });
      await tx.entitlement.updateMany({
        where: {
          userId: current.userId,
          resourceType: "GUIDANCE_SESSION",
          resourceId: current.sessionId,
          status: "ACTIVE",
          endsAt: { lte: now },
        },
        data: { status: "EXPIRED" },
      });
      released += 1;
    });
  }

  const terminalStatuses = ["CANCELLED", "COMPLETED"] as const;
  const [courseSubscriptions, commerceSubscriptions] = await Promise.all([
    prisma.courseBillingSubscription.findMany({
      where: {
        providerStatus: { in: [...terminalStatuses] },
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lte: now } }],
      },
      select: { originCheckoutId: true },
    }),
    prisma.commerceBillingSubscription.findMany({
      where: {
        providerStatus: { in: [...terminalStatuses] },
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lte: now } }],
      },
      select: { originCheckoutId: true },
    }),
  ]);
  const terminalCheckoutIds = [...courseSubscriptions, ...commerceSubscriptions]
    .flatMap((subscription) => subscription.originCheckoutId ? [subscription.originCheckoutId] : []);
  const releasedSubscriptionSlots = terminalCheckoutIds.length > 0
    ? await prisma.commerceSubscriptionSlot.deleteMany({ where: { checkoutId: { in: terminalCheckoutIds } } })
    : { count: 0 };

  const releasedExpiredCourseSlots = await prisma.commerceSubscriptionSlot.deleteMany({
    where: { productType: "COURSE", releaseAfter: { lte: now } },
  });

  const staleBefore = new Date(now.getTime() - COURSE_CHECKOUT_STALE_MS);
  const staleCourseSlots = await prisma.commerceSubscriptionSlot.findMany({
    where: {
      productType: "COURSE",
      createdAt: { lte: staleBefore },
      OR: [{ releaseAfter: null }, { releaseAfter: { gt: now } }],
    },
    orderBy: { updatedAt: "asc" },
    take: 100,
  });
  const staleCourseCheckouts = staleCourseSlots.length > 0
    ? await prisma.commerceCheckout.findMany({
        where: {
          id: { in: staleCourseSlots.map((slot) => slot.checkoutId) },
        },
      })
    : [];
  const checkoutById = new Map(staleCourseCheckouts.map((checkout) => [checkout.id, checkout]));
  let releasedAbandonedCourseSlots = 0;
  let courseReconciliationErrors = 0;

  for (const slot of staleCourseSlots) {
    const checkout = checkoutById.get(slot.checkoutId);
    if (!checkout) {
      await prisma.commerceSubscriptionSlot.delete({ where: { id: slot.id } });
      releasedAbandonedCourseSlots += 1;
      continue;
    }
    if (!["CREATED", "PROVIDER_CREATED", "PENDING"].includes(checkout.status)) {
      await prisma.commerceSubscriptionSlot.update({
        where: { id: slot.id },
        data: { updatedAt: now },
      });
      continue;
    }
    try {
      let decision: "KEEP" | "CANCEL_LOCAL" = "CANCEL_LOCAL";
      let terminalProviderStatus: string | null = null;
      if (checkout.checkoutType === "ONE_TIME" && checkout.razorpayOrderId) {
        assertRazorpayServerConfiguration();
        const order = await razorpay.orders.fetch(checkout.razorpayOrderId);
        decision = getStaleCourseCheckoutDecision("ONE_TIME", order.status);
      } else if (checkout.checkoutType === "COURSE_RECURRING" && checkout.razorpaySubscriptionId) {
        assertRazorpayServerConfiguration();
        const subscription = await razorpay.subscriptions.fetch(checkout.razorpaySubscriptionId);
        terminalProviderStatus = subscription.status;
        decision = getStaleCourseCheckoutDecision("COURSE_RECURRING", subscription.status);
      }
      if (decision !== "CANCEL_LOCAL") {
        await prisma.commerceSubscriptionSlot.update({
          where: { id: slot.id },
          data: { updatedAt: now },
        });
        continue;
      }

      await prisma.$transaction(async (tx) => {
        const cancelled = await tx.commerceCheckout.updateMany({
          where: { id: checkout.id, status: { in: ["CREATED", "PROVIDER_CREATED", "PENDING"] } },
          data: { status: "CANCELLED" },
        });
        if (cancelled.count === 0) return;
        if (checkout.checkoutType === "COURSE_RECURRING") {
          const terminalStatus = terminalProviderStatus === "completed" ? "COMPLETED" : "CANCELLED";
          await tx.courseBillingSubscription.updateMany({
            where: {
              originCheckoutId: checkout.id,
              providerStatus: { in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PENDING", "HALTED", "PAUSED"] },
            },
            data: {
              providerStatus: terminalStatus,
              ...(terminalStatus === "CANCELLED" ? { cancelledAt: now } : {}),
            },
          });
        }
        await releaseSessionSeatHold(tx, checkout.id, now);
        const result = await tx.commerceSubscriptionSlot.deleteMany({ where: { id: slot.id } });
        releasedAbandonedCourseSlots += result.count;
      });
    } catch (error) {
      courseReconciliationErrors += 1;
      console.error(`Failed to reconcile stale course checkout ${checkout.id}:`, error);
    }
  }

  return NextResponse.json({
    released,
    checked: candidates.length,
    releasedSubscriptionSlots: releasedSubscriptionSlots.count,
    releasedExpiredCourseSlots: releasedExpiredCourseSlots.count,
    releasedAbandonedCourseSlots,
    courseReconciliationErrors,
    at: now.toISOString(),
  });
}
