// app/api/payment/order/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { clerkUserId, itemId, itemType, mockIds } = await req.json();

    if (!clerkUserId || !itemId || !itemType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let amount = 0;
    let subscriptionData: any = [];

    if (itemType === "mockTest") {
      // Single mock subscription
      const mock = await prisma.mockTest.findUnique({ where: { id: itemId } });
      if (!mock || !mock.price) {
        return NextResponse.json({ error: "Invalid or free mock" }, { status: 400 });
      }
      amount = mock.price * 100;
      subscriptionData.push({ mockTestId: mock.id });
    }

    if (itemType === "mockBundle") {
      // Bundle subscription: calculate total amount
      if (!mockIds || mockIds.length === 0) {
        return NextResponse.json({ error: "No mocks selected in bundle" }, { status: 400 });
      }

      const mocks = await prisma.mockTest.findMany({
        where: { id: { in: mockIds } },
      });

      if (!mocks.length) {
        return NextResponse.json({ error: "No valid mocks found in bundle" }, { status: 400 });
      }

      amount = (mocks.reduce((acc, m) => acc + (m.price || 0), 0)) * 100;

      // Prepare subscription data
      subscriptionData = mocks.map((m) => ({
        mockTestId: m.id,
      }));
    }

    if (itemType === "course") {
      // Course purchase
      // Implement course purchase logic here if needed
    }

    // Generate receipt
    const receipt = crypto.randomUUID().slice(0, 20);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
    });

    // Create Subscription records in DB
    for (const sub of subscriptionData) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          mockTestId: sub.mockTestId,
          mockBundleId: itemType === "mockBundle" ? itemId : undefined,
          razorpayOrderId: order.id,
          paid: false,
        },
      });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Razorpay Order Error:", err);
    return NextResponse.json({ error: err?.description || "Server error" }, { status: 500 });
  }
}
