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
      billingSubscriptionId: { not: null },
      accessEndsAt: { lte: now },
      seatReleasedAt: null,
    },
    select: { id: true, sessionId: true, billingSubscriptionId: true, accessEndsAt: true, paymentStatus: true },
  });

  let released = 0;
  for (const enrollment of candidates) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.sessionEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } });
      if (!shouldReleaseRecurringSessionSeat({ ...current, now })) return;

      const subscription = await tx.commerceBillingSubscription.findUnique({
        where: { id: current.billingSubscriptionId! },
        select: { originCheckoutId: true },
      });
      if (!subscription?.originCheckoutId) return;

      const releasedSeat = await releaseConfirmedSessionSeat(tx, {
        checkoutId: subscription.originCheckoutId,
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

  return NextResponse.json({ released, checked: candidates.length, at: now.toISOString() });
}
