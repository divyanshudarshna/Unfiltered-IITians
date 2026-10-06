import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getCourseExpiryDate } from "@/lib/course-expiry";
import { getDbUserFromClerk } from "@/lib/roleAuth";
import crypto from "crypto";
import type { Coupon } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { couponCode } = await req.json();
    const { id } = await params;
    const user = await getDbUserFromClerk();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Find course
    const course = await prisma.course.findUnique({
      where: { id },
    });
    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Expired purchases may renew; active legacy or V2 access must remain protected.
    const now = new Date();
    const activeWindow = { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
    const [existingSubscription, activeEnrollment, activeEntitlement, recurringSubscription] = await Promise.all([
      prisma.subscription.findFirst({
        where: {
          userId: user.id,
          courseId: course.id,
          paid: true,
          ...activeWindow,
        },
      }),
      prisma.enrollment.findFirst({ where: { userId: user.id, courseId: course.id, ...activeWindow } }),
      prisma.entitlement.findFirst({ where: { userId: user.id, resourceType: "COURSE", resourceId: course.id, status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } }),
      prisma.courseBillingSubscription.findFirst({ where: { userId: user.id, courseId: course.id, providerStatus: { in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PENDING", "HALTED", "PAUSED"] } } }),
    ]);
    if (recurringSubscription) {
      return NextResponse.json({ error: "Please resume or manage your existing monthly subscription from the course page or dashboard." }, { status: 409 });
    }

    if (existingSubscription || activeEnrollment || activeEntitlement) {
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
    let appliedCoupon: Coupon | null = null;
    let discountAmount = 0;

    // ✅ Apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.validTill > new Date() && coupon.courseId === course.id) {
        discountAmount = Math.floor((finalPrice * coupon.discountPct) / 100);
        finalPrice = Math.max(0, finalPrice - discountAmount);
        appliedCoupon = coupon;
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
    const subscriptionExpiresAt = getCourseExpiryDate(new Date(), course.durationMonths);
    
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        courseId: course.id,
        razorpayOrderId: order.id,
        originalPrice: (course.actualPrice ?? course.price) * 100, // Store in paise
        actualAmountPaid: finalPrice * 100, // Store final amount in paise
        discountApplied: discountAmount * 100, // Store discount in paise
        couponCode: appliedCoupon?.code || null, // Store coupon code
        paid: false,
        expiresAt: subscriptionExpiresAt,
      },
    });

    // Store coupon and discount info in response for frontend
    const responseData: {
      order: typeof order;
      finalPrice: number;
      subscriptionId: string;
      couponData?: { couponId: string; code: string; discountAmount: number; discountPct: number };
    } = {
      order, 
      finalPrice,
      subscriptionId: subscription.id 
    };

    if (appliedCoupon) {
      responseData.couponData = {
        couponId: appliedCoupon.id,
        code: appliedCoupon.code,
        discountAmount,
        discountPct: appliedCoupon.discountPct
      };
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (err: unknown) {
    console.error("❌ Razorpay Order Error:", err);
    const message = err instanceof Error ? err.message : "Failed to create Razorpay order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
