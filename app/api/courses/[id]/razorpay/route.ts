import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clerkUserId, couponCode } = await req.json();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Missing clerkUserId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
    });
    if (!course || !course.price) {
      return NextResponse.json({ error: "Invalid or free course" }, { status: 400 });
    }

    let finalPrice = course.price;

    // ✅ Apply coupon if provided
    let appliedCoupon: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.validTill > new Date() && coupon.courseId === course.id) {
        finalPrice = Math.max(
          0,
          course.price - Math.floor((course.price * coupon.discountPct) / 100)
        );
        appliedCoupon = coupon.code;
      }
    }

    const amount = Math.round(finalPrice * 100); // paise
    const receipt = crypto.randomUUID().slice(0, 20);

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      payment_capture: true,
    });

    // ✅ Create a pending subscription entry (to be verified later)
    await prisma.subscription.create({
      data: {
        userId: user.id,
        courseId: course.id,
        razorpayOrderId: order.id,
        paid: false,
        // optional tracking
        // couponCode: appliedCoupon,
        // finalPrice
      },
    });

    return NextResponse.json({ order, finalPrice }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Razorpay Order Error:", err);
    return NextResponse.json(
      { error: err?.description || err.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
