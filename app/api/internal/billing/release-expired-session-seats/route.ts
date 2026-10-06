import { NextResponse } from "next/server";
import type { CourseSubscriptionProviderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { reconcileCheckout } from "@/lib/billing-reconciliation";
import { PENDING_CHECKOUT_STATUSES } from "@/lib/payment-recovery";
import { releaseConfirmedSessionSeat } from "@/lib/session-seat-inventory";
import { shouldReleaseRecurringSessionSeat } from "@/lib/session-seat-release";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  // Also recover missed renewals after the original checkout was already paid.
  const renewalWhere = {
    providerStatus: { in: ["ACTIVE", "AUTHENTICATED", "PENDING", "HALTED", "PAUSED"] as CourseSubscriptionProviderStatus[] },
    originCheckoutId: { not: null },
    OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lte: now } }],
  };
  const [courseRenewals, commerceRenewals] = await Promise.all([
    prisma.courseBillingSubscription.findMany({ where: renewalWhere, select: { originCheckoutId: true }, orderBy: { updatedAt: "asc" }, take: 25 }),
    prisma.commerceBillingSubscription.findMany({ where: renewalWhere, select: { originCheckoutId: true }, orderBy: { updatedAt: "asc" }, take: 25 }),
  ]);
  const renewalIds = [...courseRenewals, ...commerceRenewals].flatMap((row) => row.originCheckoutId ? [row.originCheckoutId] : []);
  // Discover canonical checkouts, including generic products and missing slots.
  const pendingCheckouts = await prisma.commerceCheckout.findMany({
    where: { OR: [
      { status: { in: [...PENDING_CHECKOUT_STATUSES] }, createdAt: { lte: new Date(now.getTime() - 120_000) } },
      { status: "PAID", id: { in: renewalIds } },
    ] },
    orderBy: { updatedAt: "asc" }, take: 25,
  });
  let reconciledCheckouts = 0;
  let cancelledCheckouts = 0;
  let reconciliationErrors = 0;
  const deadline = Date.now() + 45_000;
  for (const checkout of pendingCheckouts) {
    if (Date.now() >= deadline) break;
    try {
      const result = await reconcileCheckout(checkout);
      reconciledCheckouts++;
      if (result.action === "CANCEL_LOCAL") cancelledCheckouts++;
    } catch (error) {
      reconciliationErrors++;
      console.error(`Failed to reconcile pending checkout ${checkout.id}:`, error);
    } finally {
      // Rotate attempted rows without changing a concurrently paid status.
      await prisma.commerceCheckout.updateMany({
        where: { id: checkout.id, status: { in: [...PENDING_CHECKOUT_STATUSES, "PAID"] } },
        data: { updatedAt: new Date() },
      });
      if (renewalIds.includes(checkout.id)) {
        await Promise.all([
          prisma.courseBillingSubscription.updateMany({ where: { originCheckoutId: checkout.id }, data: { updatedAt: new Date() } }),
          prisma.commerceBillingSubscription.updateMany({ where: { originCheckoutId: checkout.id }, data: { updatedAt: new Date() } }),
        ]);
      }
    }
  }

  return NextResponse.json({
    released,
    checked: candidates.length,
    releasedSubscriptionSlots: releasedSubscriptionSlots.count,
    releasedExpiredCourseSlots: releasedExpiredCourseSlots.count,
    reconciledCheckouts,
    cancelledCheckouts,
    reconciliationErrors,
    at: now.toISOString(),
  });
}
