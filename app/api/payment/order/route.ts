// app/api/payment/order/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const {
      clerkUserId,
      itemId,
      itemType,
      mockIds,
      studentPhone,
      amount: frontendAmount, // ✅ receive frontend amount (discounted price)
    } = await req.json();

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
    let subscriptionData: any[] = [];
    let enrollmentData: any[] = [];
    let sessionRecord: any = null;

    // --- 1) Mock Test Purchase ---
    if (itemType === "mockTest") {
      const mock = await prisma.mockTest.findUnique({ where: { id: itemId } });
      if (!mock || !mock.price) {
        return NextResponse.json(
          { error: "Invalid or free mock" },
          { status: 400 }
        );
      }
      amount = mock.price * 100;
      subscriptionData.push({ 
        mockTestId: mock.id,
        originalPrice: mock.price,
        actualAmountPaid: mock.price, // Same as original for individual mocks
        discountApplied: 0
      });
    }

    // --- 2) Mock Bundle Purchase ---
    if (itemType === "mockBundle") {
      if (!mockIds || mockIds.length === 0) {
        return NextResponse.json(
          { error: "No mocks selected in bundle" },
          { status: 400 }
        );
      }

      const mocks = await prisma.mockTest.findMany({
        where: { id: { in: mockIds } },
      });

      if (!mocks.length) {
        return NextResponse.json(
          { error: "No valid mocks found in bundle" },
          { status: 400 }
        );
      }

      // Calculate original total price
      const originalTotalPrice = mocks.reduce((acc, m) => acc + (m.price || 0), 0);
      
      // ✅ Use frontend amount (discounted price) if provided, otherwise fallback to sum of mock prices
      let finalAmount = originalTotalPrice;
      if (frontendAmount !== undefined && frontendAmount !== null) {
        finalAmount = frontendAmount;
        amount = frontendAmount * 100; // Convert to paise
      } else {
        amount = originalTotalPrice * 100;
      }

      const discountApplied = originalTotalPrice - finalAmount;
      const amountPerMock = finalAmount / mocks.length; // Split equally among mocks

      subscriptionData = mocks.map((m) => ({
        mockTestId: m.id,
        originalPrice: m.price || 0,
        actualAmountPaid: Math.round(amountPerMock), // Split the discounted amount
        discountApplied: Math.round(((m.price || 0) - amountPerMock)), // Individual discount
      }));
    }

    // --- 3) Session Purchase ---
    if (itemType === "session") {
      sessionRecord = await prisma.session.findUnique({
        where: { id: itemId },
      });

      if (!sessionRecord || !sessionRecord.price) {
        return NextResponse.json(
          { error: "Invalid or free session" },
          { status: 400 }
        );
      }

      if (!studentPhone) {
        return NextResponse.json(
          { error: "Student phone number is required" },
          { status: 400 }
        );
      }

      // Check if already enrolled (only SUCCESS payments)
      const alreadyEnrolled = await prisma.sessionEnrollment.findFirst({
        where: {
          sessionId: sessionRecord.id,
          userId: user.id,
          paymentStatus: "SUCCESS"
        },
      });

      if (alreadyEnrolled) {
        return NextResponse.json(
          { error: "Already enrolled in this session" },
          { status: 400 }
        );
      }

      // Clean up any existing PENDING enrollments for this user-session
      await prisma.sessionEnrollment.deleteMany({
        where: {
          sessionId: sessionRecord.id,
          userId: user.id,
          paymentStatus: { in: ["PENDING", "FAILED"] }
        },
      });

      // ✅ Use frontend amount (discounted price) if provided for sessions
      if (frontendAmount !== undefined && frontendAmount !== null) {
        amount = frontendAmount * 100; // Convert to paise
      } else {
        amount = (sessionRecord.discountedPrice || sessionRecord.price) * 100;
      }

      enrollmentData.push({
        sessionId: sessionRecord.id,
        userId: user.id,
        studentName: user.name,
        studentEmail: user.email,
        studentPhone,
      });
    }

    // --- Generate receipt ---
    const receipt = crypto.randomUUID().slice(0, 20);

    // --- Create Razorpay order ---
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
    });

    // --- Save subscription records ---
    for (const sub of subscriptionData) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          mockTestId: sub.mockTestId,
          mockBundleId: itemType === "mockBundle" ? itemId : undefined,
          razorpayOrderId: order.id,
          originalPrice: (sub.originalPrice || 0) * 100, // Store in paise
          actualAmountPaid: (sub.actualAmountPaid || 0) * 100, // Store in paise
          discountApplied: (sub.discountApplied || 0) * 100, // Store in paise
          paid: false,
        },
      });
    }

    // --- Save session enrollment records ---
    for (const enr of enrollmentData) {
      await prisma.sessionEnrollment.create({
        data: {
          ...enr,
          razorpayOrderId: order.id,
          paymentStatus: "PENDING",
          amountPaid: amount / 100, // Use the actual amount being paid (converted back from paise)
        },
      });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Razorpay Order Error:", err);
    return NextResponse.json(
      { error: err?.description || "Server error" },
      { status: 500 }
    );
  }
}
