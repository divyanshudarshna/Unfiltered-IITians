// app/api/courses/[id]/razorpay/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, couponCode } =
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
      include: { course: true }
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
      data: { 
        paid: true,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date(),
      },
    });

    // ✅ Handle coupon usage tracking if coupon was used
    if (couponCode && sub.course) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode, courseId: sub.courseId! }
      });

      if (coupon) {
        // Calculate discount amount
        const basePrice = sub.course.actualPrice ?? sub.course.price;
        const discountAmount = Math.floor((basePrice * coupon.discountPct) / 100);

        // Increment coupon usage count
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } }
        });

        // Create coupon usage record
        await prisma.couponUsage.create({
          data: {
            couponId: coupon.id,
            userId: sub.userId,
            subscriptionId: sub.id,
            discountAmount
          }
        });
      }
    }

    // ✅ Ensure enrollment exists and handle course inclusions
    const existing = await prisma.enrollment.findFirst({
      where: { userId: sub.userId, courseId: sub.courseId! },
    });

    if (!existing) {
      // Get course with inclusions to calculate expiry date and handle bundled items
      const course = await prisma.course.findUnique({
        where: { id: sub.courseId! },
        select: { 
          durationMonths: true,
          inclusions: true 
        }
      });
      
      // Calculate expiry date based on course duration
      const enrollmentExpiresAt = course ? 
        new Date(Date.now() + (course.durationMonths * 30 * 24 * 60 * 60 * 1000)) : // months to milliseconds
        new Date(Date.now() + (12 * 30 * 24 * 60 * 60 * 1000)); // default 12 months

      // Use transaction to create enrollment and handle inclusions
      await prisma.$transaction(async (tx) => {
        // Create main course enrollment
        await tx.enrollment.create({
          data: {
            userId: sub.userId,
            courseId: sub.courseId!,
            expiresAt: enrollmentExpiresAt,
          },
        });

        // ✅ NEW: Handle course inclusions - automatically subscribe user to included items
        if (course?.inclusions && course.inclusions.length > 0) {
          console.log(`🎁 Processing ${course.inclusions.length} inclusions for user ${sub.userId}`);
          
          for (const inclusion of course.inclusions) {
            try {
              // Create subscription for included item with price 0 (already paid via course)
              const inclusionSubscription = await tx.subscription.create({
                data: {
                  userId: sub.userId,
                  mockTestId: inclusion.inclusionType === 'MOCK_TEST' ? inclusion.inclusionId : null,
                  mockBundleId: inclusion.inclusionType === 'MOCK_BUNDLE' ? inclusion.inclusionId : null,
                  // Note: Sessions don't use subscription model, they use SessionEnrollment
                  razorpayOrderId: `inclusion_${sub.id}_${inclusion.id}`, // Unique identifier
                  paid: true,
                  actualAmountPaid: 0, // ✅ Price is 0 since already paid via course
                  originalPrice: 0, // Set to 0 for revenue tracking consistency
                  paidAt: new Date(),
                },
              });

              // ✅ NEW: Handle session enrollments separately (they don't use subscriptions)
              if (inclusion.inclusionType === 'SESSION') {
                // Get user details for session enrollment
                const user = await tx.user.findUnique({
                  where: { id: sub.userId },
                  select: { name: true, email: true, phoneNumber: true }
                });

                if (user) {
                  await tx.sessionEnrollment.create({
                    data: {
                      userId: sub.userId,
                      sessionId: inclusion.inclusionId,
                      studentName: user.name || '',
                      studentEmail: user.email,
                      studentPhone: user.phoneNumber || '',
                      paymentStatus: 'SUCCESS',
                      amountPaid: 0, // ✅ No additional payment needed
                      enrolledAt: new Date(),
                    }
                  });
                }
              }

              console.log(`✅ Created ${inclusion.inclusionType} subscription for ${inclusion.inclusionId}`);
            } catch (inclusionError) {
              console.error(`❌ Failed to create inclusion subscription:`, inclusionError);
              // Continue with other inclusions even if one fails
            }
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Course payment verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
