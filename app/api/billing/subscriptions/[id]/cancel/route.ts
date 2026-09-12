import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import { getDbUserFromClerk } from "@/lib/roleAuth";

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
  if (["CANCELLED", "COMPLETED"].includes(subscription.providerStatus)) {
    return NextResponse.json({ success: true, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd });
  }
  if (subscription.razorpaySubscriptionId.startsWith("pending:")) {
    return NextResponse.json({ error: "Subscription is still being created" }, { status: 409 });
  }

  try {
    assertRazorpayServerConfiguration();
    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, true);
    if (courseSubscription) {
      await prisma.courseBillingSubscription.update({
        where: { id: courseSubscription.id },
        data: { cancelAtPeriodEnd: true },
      });
    } else if (commerceSubscription) {
      await prisma.commerceBillingSubscription.update({
        where: { id: commerceSubscription.id },
        data: { cancelAtPeriodEnd: true },
      });
    }
    return NextResponse.json({ success: true, cancelAtPeriodEnd: true });
  } catch (error) {
    console.error("Unable to cancel Razorpay subscription:", error);
    return NextResponse.json({ error: "Unable to schedule subscription cancellation" }, { status: 502 });
  }
}
