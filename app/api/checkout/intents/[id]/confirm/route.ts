import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUserFromClerk } from "@/lib/roleAuth";
import { verifyCheckoutPaymentSignature } from "@/lib/payment-recovery";
import { reconcileCheckout } from "@/lib/billing-reconciliation";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUserFromClerk();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const checkout = await prisma.commerceCheckout.findFirst({ where: { id, userId: user.id } });
  if (!checkout) return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid payment confirmation" }, { status: 400 }); }
  const recurring = checkout.checkoutType !== "ONE_TIME";
  const providerId = recurring ? checkout.razorpaySubscriptionId : checkout.razorpayOrderId;
  const receivedId = recurring ? body?.razorpay_subscription_id : body?.razorpay_order_id;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: "Payment provider is not configured" }, { status: 503 });
  if (!providerId || receivedId !== providerId || typeof body?.razorpay_payment_id !== "string" || typeof body?.razorpay_signature !== "string"
    || !verifyCheckoutPaymentSignature({ paymentId: body.razorpay_payment_id, providerId, signature: body.razorpay_signature, recurring, secret })) {
    return NextResponse.json({ error: "Invalid payment confirmation signature" }, { status: 401 });
  }
  if (checkout.status === "PAID") return NextResponse.json({ received: true, status: "PAID" });
  try {
    await reconcileCheckout(checkout);
    const current = await prisma.commerceCheckout.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ received: true, status: current.status });
  } catch (error) {
    console.error(`Payment confirmation reconciliation failed for ${id}:`, error);
    return NextResponse.json({ error: "Payment confirmation is pending. Please retry shortly.", code: "RECONCILIATION_PENDING" }, { status: 502 });
  }
}
