import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Mark all subscriptions linked to this order as paid
    const updatedSubscriptions = await prisma.subscription.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: { paid: true },
    });

    return NextResponse.json({ success: true, updatedSubscriptions });
  } catch (err) {
    console.error("❌ Payment verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
