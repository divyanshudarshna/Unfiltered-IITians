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

    // ✅ Find user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Find course
    const course = await prisma.course.findUnique({
      where: { id: params.id },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // ✅ Check if user already has a paid subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
        paid: true,
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: "You are already enrolled in this course.",
          redirectTo: `/dashboard/courses`,
        },
        { status: 400 }
      );
    }

    // ✅ Base price = actualPrice (fallback to price)
    let finalPrice = course.actualPrice ?? course.price;
    let appliedCoupon: string | null = null;

    // ✅ Apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.validTill > new Date() && coupon.courseId === course.id) {
        const discountAmount = Math.floor((finalPrice * coupon.discountPct) / 100);
        finalPrice = Math.max(0, finalPrice - discountAmount);
        appliedCoupon = coupon.code;
      }
    }

    const amount = Math.round(finalPrice * 100); // in paise
    const receipt = crypto.randomUUID().slice(0, 20);

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      payment_capture: true,
    });

    // ✅ Create a pending subscription entry
    await prisma.subscription.create({
      data: {
        userId: user.id,
        courseId: course.id,
        razorpayOrderId: order.id,
        paid: false,
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
