import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import { getDbUserFromClerk } from "@/lib/roleAuth";
import { closeUnpaidCheckout } from "@/lib/billing-reconciliation";
import { getSubscriptionCancellationMode } from "@/lib/payment-recovery";
import { CourseSubscriptionProviderStatus } from "@prisma/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await getDbUserFromClerk();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [courseSubscription, commerceSubscription] = await Promise.all([
    prisma.courseBillingSubscription.findFirst({ where: { id, userId: user.id } }),
    prisma.commerceBillingSubscription.findFirst({ where: { id, userId: user.id } }),
  ]);
  const subscription = courseSubscription ?? commerceSubscription;
  if (!subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  if (subscription.razorpaySubscriptionId.startsWith("pending:")) {
    return NextResponse.json({ error: "Subscription is still being created" }, { status: 409 });
  }

  try {
    assertRazorpayServerConfiguration();
    const observedAt = new Date();
    const provider = await razorpay.subscriptions.fetch(subscription.razorpaySubscriptionId);
    if (provider.id !== subscription.razorpaySubscriptionId) throw new Error("Subscription identity mismatch");
    const mode = getSubscriptionCancellationMode(provider as unknown as Record<string, unknown>);
    const result = mode === "TERMINAL" || (mode === "CYCLE_END" && subscription.cancelAtPeriodEnd)
      ? provider : await razorpay.subscriptions.cancel(provider.id, mode === "CYCLE_END");
    if (result.id !== provider.id) throw new Error("Cancellation identity mismatch");
    const normalizedStatus = result.status === "expired" ? "CANCELLED" : result.status.toUpperCase();
    if (!Object.values(CourseSubscriptionProviderStatus).includes(normalizedStatus as CourseSubscriptionProviderStatus)) throw new Error("Unknown provider status");
    const terminal = ["CANCELLED", "COMPLETED"].includes(normalizedStatus);
    const cancelAtPeriodEnd = mode === "CYCLE_END" && !terminal;
    const data = {
      providerStatus: normalizedStatus as CourseSubscriptionProviderStatus,
      cancelAtPeriodEnd,
      ...(terminal ? { cancelledAt: observedAt } : {}),
      ...(result.current_start ? { currentPeriodStart: new Date(result.current_start * 1000) } : {}),
      ...(result.current_end ? { currentPeriodEnd: new Date(result.current_end * 1000) } : {}),
      lastProviderEventAt: observedAt,
    };
    const where = { id: subscription.id, OR: [{ lastProviderEventAt: null }, { lastProviderEventAt: { lte: observedAt } }] };
    if (courseSubscription) await prisma.courseBillingSubscription.updateMany({ where, data });
    else await prisma.commerceBillingSubscription.updateMany({ where, data });
    if (terminal && provider.paid_count === 0 && subscription.originCheckoutId) {
      await closeUnpaidCheckout(subscription.originCheckoutId, result.status);
    }
    return NextResponse.json({ success: true, cancelAtPeriodEnd, providerStatus: normalizedStatus });
  } catch (error) {
    console.error("Unable to cancel Razorpay subscription:", error);
    return NextResponse.json({ error: "Unable to verify or cancel this subscription. Please retry shortly." }, { status: 502 });
  }
}
