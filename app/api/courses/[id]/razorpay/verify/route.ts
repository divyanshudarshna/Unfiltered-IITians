// app/api/courses/[id]/razorpay/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ✅ Verify signature
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!.trim())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // ✅ Find the subscription
    const sub = await prisma.subscription.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Subscription not found for this order" },
        { status: 404 }
      );
    }

    // ✅ Mark subscription as paid
    await prisma.subscription.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: { paid: true },
    });

    // ✅ Ensure enrollment exists
    const existing = await prisma.enrollment.findFirst({
      where: { userId: sub.userId, courseId: sub.courseId! },
    });

    if (!existing) {
      // Get course to calculate expiry date
      const course = await prisma.course.findUnique({
        where: { id: sub.courseId! },
        select: { durationMonths: true }
      });
      
      // Calculate expiry date based on course duration
      const enrollmentExpiresAt = course ? 
        new Date(Date.now() + (course.durationMonths * 30 * 24 * 60 * 60 * 1000)) : // months to milliseconds
        new Date(Date.now() + (12 * 30 * 24 * 60 * 60 * 1000)); // default 12 months

      await prisma.enrollment.create({
        data: {
          userId: sub.userId,
          courseId: sub.courseId!,
          expiresAt: enrollmentExpiresAt,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Course payment verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
