import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseConfirmedSessionSeat } from "@/lib/session-seat-inventory";
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

  return NextResponse.json({
    released,
    checked: candidates.length,
    releasedSubscriptionSlots: releasedSubscriptionSlots.count,
    at: now.toISOString(),
  });
}
