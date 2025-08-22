// app/api/courses/[id]/razorpay/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!.trim())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 1) Mark subscription as paid and fetch it to know the userId + courseId
    const updated = await prisma.subscription.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { paid: true },
      select: { userId: true, courseId: true },
    }).catch(async () => {
      // Fallback if unique constraint not set: find first then updateMany
      const sub = await prisma.subscription.findFirst({ where: { razorpayOrderId: razorpay_order_id } });
      if (!sub) throw new Error("Subscription not found for this order");
      await prisma.subscription.updateMany({ where: { razorpayOrderId: razorpay_order_id }, data: { paid: true } });
      return { userId: sub.userId, courseId: sub.courseId };
    });

    // 2) Create enrollment if not exists
    const existing = await prisma.enrollment.findFirst({
      where: { userId: updated.userId, courseId: updated.courseId },
    });

    if (!existing) {
      await prisma.enrollment.create({
        data: { userId: updated.userId, courseId: updated.courseId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Course payment verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
