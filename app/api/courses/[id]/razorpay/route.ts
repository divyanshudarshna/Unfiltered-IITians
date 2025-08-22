// app/api/courses/[id]/razorpay/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clerkUserId } = await req.json();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Missing clerkUserId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const course = await prisma.course.findUnique({
      where: { id: params.id },
    });
    if (!course || !course.price) return NextResponse.json({ error: "Invalid or free course" }, { status: 400 });

    const amount = course.price * 100; // in paise
    const receipt = crypto.randomUUID().slice(0, 20);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      payment_capture: true,
    });

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        courseId: course.id,
        razorpayOrderId: order.id,
        paid: false,
      },
    });

    return NextResponse.json({ order, subscription }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Razorpay Order Error:", err);
    return NextResponse.json({ error: err?.description || "Failed to create Razorpay order" }, { status: 500 });
  }
}
