// app/api/payment/order/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getDbUserFromClerk } from "@/lib/roleAuth";
import crypto from "crypto";
import type { Session } from "@prisma/client";

interface LegacySubscriptionDraft {
  mockTestId: string | null;
  mockBundleId: string | null;
  originalPrice: number;
  actualAmountPaid: number;
  discountApplied: number;
}

interface LegacySessionEnrollmentDraft {
  sessionId: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  accessEndsAt: Date | null;
}

export async function POST(req: Request) {
  try {
    const {
      itemId,
      itemType,
      studentPhone,
    } = await req.json();

    if (typeof itemId !== "string" || !["mockTest", "mockBundle", "session"].includes(itemType)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await getDbUserFromClerk();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let amount = 0;
    let subscriptionData: LegacySubscriptionDraft[] = [];
    const enrollmentData: LegacySessionEnrollmentDraft[] = [];
    let sessionRecord: Session | null = null;

    // --- 1) Mock Test Purchase ---
    if (itemType === "mockTest") {
      const mock = await prisma.mockTest.findUnique({ where: { id: itemId } });
      if (!mock || mock.status !== "PUBLISHED" || !mock.price) {
        return NextResponse.json(
          { error: "Invalid or free mock" },
          { status: 400 }
        );
      }
      if (mock.billingMode === "RECURRING" && mock.subscriptionEnabled) {
        return NextResponse.json({ error: "This mock requires recurring checkout" }, { status: 409 });
      }
      amount = Math.round(mock.price * 100);
      subscriptionData.push({ 
        mockTestId: mock.id,
        mockBundleId: null, // Individual mock purchase
        originalPrice: mock.price,
        actualAmountPaid: mock.price, // Same as original for individual mocks
        discountApplied: 0
      });
    }

    // --- 2) Mock Bundle Purchase ---
    if (itemType === "mockBundle") {
      const bundle = await prisma.mockBundle.findUnique({ where: { id: itemId } });
      if (!bundle || bundle.status !== "PUBLISHED" || !bundle.mockIds.length) {
        return NextResponse.json(
          { error: "Invalid or unavailable mock bundle" },
          { status: 400 }
        );
      }
      if (bundle.billingMode === "RECURRING" && bundle.subscriptionEnabled) {
        return NextResponse.json({ error: "This bundle requires recurring checkout" }, { status: 409 });
      }
      const mockIds = [...new Set(bundle.mockIds)];
      const mocks = await prisma.mockTest.findMany({
        where: { id: { in: mockIds }, status: "PUBLISHED" },
      });

      if (mocks.length !== mockIds.length) {
        return NextResponse.json(
          { error: "No valid mocks found in bundle" },
          { status: 400 }
        );
      }

      const finalAmount = bundle.discountedPrice ?? bundle.basePrice;
      amount = Math.round(finalAmount * 100);
      const originalPrice = bundle.basePrice;
      const discountApplied = Math.max(0, originalPrice - finalAmount);

      // ✅ FIX: Set individual mock subscriptions with 0 amount since they're covered by the bundle
      subscriptionData = mocks.map((m) => ({
        mockTestId: m.id,
        mockBundleId: null, // ✅ Individual mocks should NOT be linked to bundle
        originalPrice: m.price || 0,
        actualAmountPaid: 0, // ✅ Set to 0 - covered by bundle purchase
        discountApplied: m.price || 0, // Full price is discounted since covered by bundle
      }));

      // ✅ Add bundle-level subscription record with the actual amount paid
      subscriptionData.push({
        mockTestId: null, // ✅ Bundle subscription is NOT linked to individual mock
        mockBundleId: itemId, // ✅ Link to the bundle
        originalPrice,
        actualAmountPaid: finalAmount,
        discountApplied: discountApplied,
      });
    }

    // --- 3) Session Purchase ---
    if (itemType === "session") {
      sessionRecord = await prisma.session.findUnique({
        where: { id: itemId },
      });

      if (!sessionRecord || sessionRecord.status !== "PUBLISHED" || !sessionRecord.price) {
        return NextResponse.json(
          { error: "Invalid or free session" },
          { status: 400 }
        );
      }
      if (sessionRecord.billingMode === "RECURRING" && sessionRecord.subscriptionEnabled) {
        return NextResponse.json(
          { error: "This guidance program requires recurring checkout" },
          { status: 409 },
        );
      }
      if (sessionRecord.expiryDate && sessionRecord.expiryDate <= new Date()) {
        return NextResponse.json({ error: "This guidance session has expired" }, { status: 409 });
      }

      if (typeof studentPhone !== "string" || !studentPhone.trim()) {
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

      amount = Math.round((sessionRecord.discountedPrice ?? sessionRecord.price) * 100);
      const pendingEnrollment = await prisma.sessionEnrollment.findFirst({
        where: { sessionId: sessionRecord.id, userId: user.id, paymentStatus: { in: ["PENDING", "FAILED"] } },
      });
      if (pendingEnrollment) {
        if (!pendingEnrollment.razorpayOrderId || Math.round((pendingEnrollment.amountPaid ?? 0) * 100) !== amount) {
          return NextResponse.json({ error: "A previous payment attempt needs review. Please contact support before starting another payment." }, { status: 409 });
        }
        const previousOrder = await razorpay.orders.fetch(pendingEnrollment.razorpayOrderId);
        if (previousOrder.id !== pendingEnrollment.razorpayOrderId || Number(previousOrder.amount) !== amount || previousOrder.currency !== "INR") {
          return NextResponse.json({ error: "The previous order needs payment review" }, { status: 409 });
        }
        if (previousOrder.status === "paid") {
          return NextResponse.json({ error: "Payment was received for the previous checkout. Please contact support to confirm access." }, { status: 409 });
        }
        return NextResponse.json({ order: previousOrder, resumed: true }, { status: 200 });
      }

      enrollmentData.push({
        sessionId: sessionRecord.id,
        userId: user.id,
        studentName: user.name || "Student",
        studentEmail: user.email,
        studentPhone,
        accessEndsAt: sessionRecord.expiryDate,
      });
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "This product does not have a valid paid price" }, { status: 400 });
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
          mockTestId: sub.mockTestId || null,
          mockBundleId: sub.mockBundleId || null, // Use mockBundleId from subscription data
          razorpayOrderId: order.id,
          originalPrice: Math.round((sub.originalPrice || 0) * 100),
          actualAmountPaid: Math.round((sub.actualAmountPaid || 0) * 100),
          discountApplied: Math.round((sub.discountApplied || 0) * 100),
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
  } catch (err: unknown) {
    console.error("❌ Razorpay Order Error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
