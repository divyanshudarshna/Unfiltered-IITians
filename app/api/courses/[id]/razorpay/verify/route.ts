// app/api/courses/[id]/razorpay/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCourseExpiryDate } from "@/lib/course-expiry";
import { getLaterAccessEnd } from "@/lib/commerce-entitlement";
import { getSnapshottedCourseDurationMonths } from "@/lib/purchase-access-window";
import { assertRazorpayServerConfiguration, razorpay } from "@/lib/razorpay";
import { getDbUserFromClerk } from "@/lib/roleAuth";
import crypto from "crypto";
import * as Email from "@/lib/email";

export async function POST(req: Request) {
  try {
    const authenticatedUser = await getDbUserFromClerk();
    if (!authenticatedUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ✅ Verify signature
    assertRazorpayServerConfiguration();
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!.trim())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSig, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");
    if (
      expectedBuffer.length !== receivedBuffer.length
      || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
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
    if (sub.userId !== authenticatedUser.id) {
      return NextResponse.json({ error: "This payment does not belong to the current user" }, { status: 403 });
    }

    if (sub.paid) {
      return sub.razorpayPaymentId === razorpay_payment_id
        ? NextResponse.json({ success: true, alreadyProcessed: true })
        : NextResponse.json({ error: "Order was already paid by another payment" }, { status: 409 });
    }

    if (!sub.expiresAt) {
      return NextResponse.json({ error: "Course access terms are missing for this order" }, { status: 409 });
    }

    const providerPayment = await razorpay.payments.fetch(razorpay_payment_id) as unknown as Record<string, unknown>;
    const providerOrderId = typeof providerPayment.order_id === "string" ? providerPayment.order_id : null;
    const providerStatus = typeof providerPayment.status === "string" ? providerPayment.status : null;
    const providerCurrency = typeof providerPayment.currency === "string" ? providerPayment.currency : null;
    const providerAmount = typeof providerPayment.amount === "number"
      ? providerPayment.amount
      : Number(providerPayment.amount);
    if (
      providerOrderId !== razorpay_order_id
      || providerStatus !== "captured"
      || providerCurrency !== "INR"
      || !Number.isInteger(providerAmount)
      || providerAmount !== sub.actualAmountPaid
    ) {
      return NextResponse.json({ error: "Razorpay payment does not match this order" }, { status: 409 });
    }

    // The legacy callback has no signed capture-event timestamp. Use the
    // successful server verification time rather than payment creation time.
    const paidAt = new Date();
    const durationMonths = getSnapshottedCourseDurationMonths(sub.createdAt, sub.expiresAt);
    const courseExpiresAt = getCourseExpiryDate(paidAt, durationMonths);

    // Claim the payment and grant every current purchase component atomically.
    // Paid retries return above so later admin edits cannot alter this purchase.
    const paymentClaimed = await prisma.$transaction(async (tx) => {
      const paymentClaim = await tx.subscription.updateMany({
        where: { id: sub.id, paid: false },
        data: {
          paid: true,
          razorpayPaymentId: razorpay_payment_id,
          paidAt,
          expiresAt: courseExpiresAt,
        },
      });
      if (paymentClaim.count === 0) return false;
      const course = await tx.course.findUnique({
        where: { id: sub.courseId! },
        select: { inclusions: true },
      });
      if (!course) throw new Error("Course is unavailable during payment fulfillment");
      const existing = await tx.enrollment.findFirst({
        where: { userId: sub.userId, courseId: sub.courseId! },
      });
      if (!existing) {
        await tx.enrollment.create({
          data: {
            userId: sub.userId,
            courseId: sub.courseId!,
            enrolledAt: paidAt,
            expiresAt: courseExpiresAt,
          },
        });
      } else if (!existing.expiresAt || existing.expiresAt < courseExpiresAt) {
        await tx.enrollment.update({
          where: { id: existing.id },
          data: { expiresAt: courseExpiresAt },
        });
      }
    // ✅ Handle coupon usage tracking if coupon was used
    if (sub.couponCode && sub.course) {
        const existingUsage = await tx.couponUsage.findUnique({
          where: { subscriptionId: sub.id },
        });
        if (!existingUsage) {
          const coupon = await tx.coupon.findFirst({
            where: { code: sub.couponCode!, courseId: sub.courseId! },
          });
          if (coupon) {
            const basePrice = sub.course!.actualPrice ?? sub.course!.price;
            const discountAmount = Math.floor((basePrice * coupon.discountPct) / 100);
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usageCount: { increment: 1 } },
            });
            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                userId: sub.userId,
                subscriptionId: sub.id,
                discountAmount,
              },
            });
          }
        }
    }

    // ✅ ALWAYS handle course inclusions - regardless of enrollment status
    // This ensures inclusions are processed even if user already had course enrollment
    if (course?.inclusions && course.inclusions.length > 0) {
      
      
      
      try {
        {
          for (const inclusion of course.inclusions!) {
            try {
              
              
              // Handle different inclusion types
              if (inclusion.inclusionType === 'MOCK_TEST') {
                // Check if subscription already exists
                const existingMockSub = await tx.subscription.findFirst({
                  where: {
                    userId: sub.userId,
                    mockTestId: inclusion.inclusionId,
                    paid: true,
                  }
                });
                
                if (!existingMockSub) {
                  await tx.subscription.create({
                    data: {
                      userId: sub.userId,
                      mockTestId: inclusion.inclusionId,
                      razorpayOrderId: `inclusion_mock_${sub.id}_${inclusion.id}`,
                      paid: true,
                      actualAmountPaid: 0,
                      originalPrice: 0,
                      paidAt,
                      expiresAt: courseExpiresAt,
                    },
                  });
                  
                } else if (existingMockSub.expiresAt && existingMockSub.expiresAt < courseExpiresAt) {
                  await tx.subscription.update({
                    where: { id: existingMockSub.id },
                    data: { expiresAt: courseExpiresAt },
                  });
                }
              } else if (inclusion.inclusionType === 'MOCK_BUNDLE') {
                // For mock bundles, we need to create individual subscriptions for each mock in the bundle
                // This matches the behavior of individual mock bundle purchases
                
                // Check if bundle subscription already exists
                const existingBundleSub = await tx.subscription.findFirst({
                  where: {
                    userId: sub.userId,
                    mockBundleId: inclusion.inclusionId,
                    paid: true,
                  }
                });
                
                const mockBundle = await tx.mockBundle.findUnique({
                  where: { id: inclusion.inclusionId },
                  select: { id: true, mockIds: true },
                });
                if (!mockBundle || mockBundle.mockIds.length === 0) {
                  throw new Error(`Included mock bundle ${inclusion.inclusionId} is unavailable`);
                }

                for (const mockId of mockBundle.mockIds) {
                  const existingMockSub = await tx.subscription.findFirst({
                    where: { userId: sub.userId, mockTestId: mockId, paid: true },
                  });
                  if (!existingMockSub) {
                    await tx.subscription.create({
                      data: {
                        userId: sub.userId,
                        mockTestId: mockId,
                        mockBundleId: mockBundle.id,
                        razorpayOrderId: `inclusion_bundle_mock_${sub.id}_${mockId}`,
                        paid: true,
                        actualAmountPaid: 0,
                        originalPrice: 0,
                        paidAt,
                        expiresAt: courseExpiresAt,
                      },
                    });
                  } else if (existingMockSub.expiresAt && existingMockSub.expiresAt < courseExpiresAt) {
                    await tx.subscription.update({
                      where: { id: existingMockSub.id },
                      data: { expiresAt: courseExpiresAt },
                    });
                  }
                }

                if (!existingBundleSub) {
                  await tx.subscription.create({
                    data: {
                      userId: sub.userId,
                      mockBundleId: inclusion.inclusionId,
                      razorpayOrderId: `inclusion_bundle_${sub.id}_${inclusion.id}`,
                      paid: true,
                      actualAmountPaid: 0,
                      originalPrice: 0,
                      paidAt,
                      expiresAt: courseExpiresAt,
                    },
                  });
                } else if (existingBundleSub.expiresAt && existingBundleSub.expiresAt < courseExpiresAt) {
                  await tx.subscription.update({
                    where: { id: existingBundleSub.id },
                    data: { expiresAt: courseExpiresAt },
                  });
                }
              } else if (inclusion.inclusionType === 'SESSION') {
                
                
                // Check if session enrollment already exists with SUCCESS status (same as individual sessions)
                const existingSessionEnrollment = await tx.sessionEnrollment.findFirst({
                  where: {
                    userId: sub.userId,
                    sessionId: inclusion.inclusionId,
                    paymentStatus: 'SUCCESS' // Important: only check for successful enrollments
                  }
                });
                
                
                
                if (!existingSessionEnrollment) {
                  // Get user and session details (same pattern as individual sessions)
                  const [user, session] = await Promise.all([
                    tx.user.findUnique({
                      where: { id: sub.userId },
                      select: { name: true, email: true, phoneNumber: true }
                    }),
                    tx.session.findUnique({
                      where: { id: inclusion.inclusionId },
                      select: { discountedPrice: true, price: true }
                    })
                  ]);

                  
                  

                  if (user && session) {
                    await tx.sessionEnrollment.create({
                      data: {
                        userId: sub.userId,
                        sessionId: inclusion.inclusionId,
                        studentName: user.name || '',
                        studentEmail: user.email,
                        studentPhone: user.phoneNumber || 'N/A', // Use existing phone or N/A for course inclusions
                        razorpayOrderId: `course_inclusion_session_${sub.id}_${inclusion.id}`, // Add missing razorpayOrderId
                        paymentStatus: 'SUCCESS',
                        amountPaid: 0, // Free as part of course inclusion
                        enrolledAt: new Date(),
                        accessEndsAt: courseExpiresAt,
                      }
                    });
                    
                  } else {
                    const missingItems = [];
                    if (!user) missingItems.push('user');
                    if (!session) missingItems.push('session');
                    throw new Error(`Missing course inclusion data: ${missingItems.join(', ')}`);
                  }
                } else if (existingSessionEnrollment.accessEndsAt) {
                  await tx.sessionEnrollment.update({
                    where: { id: existingSessionEnrollment.id },
                    data: {
                      accessEndsAt: getLaterAccessEnd(
                        existingSessionEnrollment.accessEndsAt,
                        courseExpiresAt,
                      ),
                    },
                  });
                }
              }
            } catch (inclusionError) {
              console.error(`❌ Failed to process ${inclusion.inclusionType} inclusion ${inclusion.inclusionId}:`, inclusionError);
              throw inclusionError;
            }
          }
        }
        
        
      } catch (transactionError) {
        console.error("❌ Failed to process inclusions in transaction:", transactionError);
        throw transactionError;
      }
    } else {
      
    }

      return true;
    });

    // ✅ Send course purchase confirmation email
    if (paymentClaimed) try {
      const user = await prisma.user.findUnique({
        where: { id: sub.userId },
        select: { email: true, name: true }
      });

      if (user && sub.course) {
        
        
        // Convert amount from paise to rupees
        const amountInRupees = ((sub.actualAmountPaid || sub.course.price) / 100).toFixed(2);
        
        const expiryDateString = courseExpiresAt.toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        
        
        
        const emailResult = await Email.sendEmail({
          to: user.email,
          template: 'course_purchase',
          data: {
            userName: user.name || 'Student',
            courseName: sub.course.title,
            purchaseAmount: amountInRupees,
            additionalInfo: expiryDateString, // Send expiry date in additionalInfo
          },
        });
        
        if (emailResult.success) {
          
        } else {
          console.error(`❌ Failed to send course purchase email:`, emailResult.error);
        }
      } else {
        console.error(`❌ Cannot send email - User or course missing:`, { 
          hasUser: !!user, 
          hasCourse: !!sub.course 
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending course purchase email:', emailError);
      // Don't fail the payment verification if email fails
    }

    return NextResponse.json({ success: true, alreadyProcessed: !paymentClaimed });
  } catch (err) {
    console.error("❌ Course payment verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
