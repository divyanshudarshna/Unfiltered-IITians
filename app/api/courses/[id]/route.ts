import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";

interface Params {
  params: { id: string };
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request, { params }: Params) {
  try {
    const { userId, couponCode } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Convert courseId to string
    const courseId = new ObjectId(params.id).toString();

    // Fetch course
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Amount in paise
    let amount = course.price * 100;

    // Apply coupon if valid
    let appliedCouponId: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { courseId, code: couponCode, validTill: { gte: new Date() } },
      });
      if (coupon) {
        amount = amount - (amount * coupon.discountPct) / 100;
        appliedCouponId = coupon.id;
      }
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      payment_capture: true, // ✅ boolean instead of 1
    });

    // Save subscription (paid = false initially)
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        mockTestId: "", // optional placeholder for mocks
        razorpayOrderId: order.id,
        paid: false,
      },
    });

    return NextResponse.json({ order, subscription, appliedCouponId });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
