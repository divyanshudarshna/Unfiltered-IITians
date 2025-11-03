// app/api/courses/[id]/razorpay/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import * as Email from "@/lib/email";

export async function POST(req: Request) {
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

    // ✅ Ensure enrollment exists
    const existing = await prisma.enrollment.findFirst({
      where: { userId: sub.userId, courseId: sub.courseId! },
    });

    // Get course with inclusions for both enrollment creation and inclusion processing
    const course = await prisma.course.findUnique({
      where: { id: sub.courseId! },
      select: { 
        durationMonths: true,
        inclusions: true 
      }
    });

    if (!existing) {
      // Calculate expiry date based on course duration
      const enrollmentExpiresAt = course ? 
        new Date(Date.now() + (course.durationMonths * 30 * 24 * 60 * 60 * 1000)) : // months to milliseconds
        new Date(Date.now() + (12 * 30 * 24 * 60 * 60 * 1000)); // default 12 months

      // Create main course enrollment
      await prisma.enrollment.create({
        data: {
          userId: sub.userId,
          courseId: sub.courseId!,
          expiresAt: enrollmentExpiresAt,
        },
      });
    }

    // ✅ ALWAYS handle course inclusions - regardless of enrollment status
    // This ensures inclusions are processed even if user already had course enrollment
    if (course?.inclusions && course.inclusions.length > 0) {
      console.log(`🎁 Processing ${course.inclusions.length} inclusions for user ${sub.userId}`);
      console.log(`📋 Course inclusions:`, course.inclusions.map(inc => ({ 
        type: inc.inclusionType, 
        id: inc.inclusionId 
      })));
      
      try {
        await prisma.$transaction(async (tx) => {
          console.log("🔄 Starting inclusions transaction");
          for (const inclusion of course.inclusions!) {
            try {
              console.log(`🔄 Processing inclusion: ${inclusion.inclusionType} - ${inclusion.inclusionId}`);
              
              // Handle different inclusion types
              if (inclusion.inclusionType === 'MOCK_TEST') {
                // Check if subscription already exists
                const existingMockSub = await tx.subscription.findFirst({
                  where: {
                    userId: sub.userId,
                    mockTestId: inclusion.inclusionId
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
                      paidAt: new Date(),
                    },
                  });
                  console.log(`✅ Created MOCK_TEST subscription for ${inclusion.inclusionId}`);
                }
              } else if (inclusion.inclusionType === 'MOCK_BUNDLE') {
                // For mock bundles, we need to create individual subscriptions for each mock in the bundle
                // This matches the behavior of individual mock bundle purchases
                
                // Check if bundle subscription already exists
                const existingBundleSub = await tx.subscription.findFirst({
                  where: {
                    userId: sub.userId,
                    mockBundleId: inclusion.inclusionId
                  }
                });
                
                if (!existingBundleSub) {
                  // Get mock bundle details to find all included mocks
                  const mockBundle = await tx.mockBundle.findUnique({
                    where: { id: inclusion.inclusionId },
                    select: { 
                      id: true,
                      mockIds: true, 
                      discountedPrice: true, 
                      basePrice: true 
                    }
                  });

                  if (mockBundle && mockBundle.mockIds && mockBundle.mockIds.length > 0) {
                    console.log(`📦 Processing MockBundle ${inclusion.inclusionId} with ${mockBundle.mockIds.length} mocks`);
                    
                    // Create individual subscriptions for each mock in the bundle
                    for (const mockId of mockBundle.mockIds) {
                      // Check if user already has this mock subscription
                      const existingMockSub = await tx.subscription.findFirst({
                        where: {
                          userId: sub.userId,
                          mockTestId: mockId,
                          paid: true
                        }
                      });

                      if (!existingMockSub) {
                        await tx.subscription.create({
                          data: {
                            userId: sub.userId,
                            mockTestId: mockId,
                            mockBundleId: mockBundle.id, // Link to parent bundle
                            razorpayOrderId: `inclusion_bundle_mock_${sub.id}_${mockId}`,
                            paid: true,
                            actualAmountPaid: 0,
                            originalPrice: 0,
                            paidAt: new Date(),
                          },
                        });
                        console.log(`✅ Created mock subscription for ${mockId} from bundle ${inclusion.inclusionId}`);
                      } else {
                        console.log(`ℹ️ Mock ${mockId} already has subscription, skipping`);
                      }
                    }

                    // Also create the main bundle subscription record
                    await tx.subscription.create({
                      data: {
                        userId: sub.userId,
                        mockBundleId: inclusion.inclusionId,
                        razorpayOrderId: `inclusion_bundle_${sub.id}_${inclusion.id}`,
                        paid: true,
                        actualAmountPaid: 0,
                        originalPrice: 0,
                        paidAt: new Date(),
                      },
                    });
                    console.log(`✅ Created MOCK_BUNDLE subscription for ${inclusion.inclusionId} with ${mockBundle.mockIds.length} individual mocks`);
                  } else {
                    console.error(`❌ MockBundle ${inclusion.inclusionId} not found or has no mocks`);
                  }
                } else {
                  console.log(`ℹ️ MOCK_BUNDLE subscription already exists for ${inclusion.inclusionId}`);
                }
              } else if (inclusion.inclusionType === 'SESSION') {
                console.log(`🎓 Processing SESSION inclusion: ${inclusion.inclusionId}`);
                
                // Check if session enrollment already exists with SUCCESS status (same as individual sessions)
                const existingSessionEnrollment = await tx.sessionEnrollment.findFirst({
                  where: {
                    userId: sub.userId,
                    sessionId: inclusion.inclusionId,
                    paymentStatus: 'SUCCESS' // Important: only check for successful enrollments
                  }
                });
                
                console.log(`🔍 Existing session enrollment with SUCCESS status found: ${!!existingSessionEnrollment}`);
                
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

                  console.log(`👤 User found: ${user ? user.email : 'not found'}`);
                  console.log(`📅 Session found: ${session ? 'yes' : 'not found'}`);

                  if (user && session) {
                    const sessionPrice = session.discountedPrice || session.price || 0;

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
                      }
                    });
                    console.log(`✅ Created SESSION enrollment for ${inclusion.inclusionId} for user ${user.email} (original price: ₹${sessionPrice})`);
                  } else {
                    const missingItems = [];
                    if (!user) missingItems.push('user');
                    if (!session) missingItems.push('session');
                    console.error(`❌ Missing data for session enrollment: ${missingItems.join(', ')} not found. userId=${sub.userId}, sessionId=${inclusion.inclusionId}`);
                  }
                } else {
                  console.log(`ℹ️ SESSION enrollment already exists for ${inclusion.inclusionId}`);
                }
              }
            } catch (inclusionError) {
              console.error(`❌ Failed to process ${inclusion.inclusionType} inclusion ${inclusion.inclusionId}:`, inclusionError);
              // Continue with other inclusions even if one fails
            }
          }
        });
        
        console.log(`✅ Inclusions transaction completed successfully for user ${sub.userId}`);
      } catch (transactionError) {
        console.error("❌ Failed to process inclusions in transaction:", transactionError);
        // Don't fail the entire verification - enrollment is already created
      }
    } else {
      console.log(`ℹ️ No inclusions to process for course ${sub.courseId}`);
    }

    // ✅ Send course purchase confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: sub.userId },
        select: { email: true, name: true }
      });

      if (user && sub.course) {
        console.log(`📧 Attempting to send course purchase email to ${user.email}`);
        
        // Convert amount from paise to rupees
        const amountInRupees = ((sub.actualAmountPaid || sub.course.price) / 100).toFixed(2);
        
        // Calculate expiry date based on course duration
        const enrollmentExpiresAt = new Date(Date.now() + (sub.course.durationMonths * 30 * 24 * 60 * 60 * 1000));
        const expiryDateString = enrollmentExpiresAt.toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        
        console.log(`📧 Email data:`, {
          userName: user.name,
          courseName: sub.course.title,
          amountInRupees,
          courseExpiry: expiryDateString,
          durationMonths: sub.course.durationMonths
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
          console.log(`✅ Course purchase email sent successfully to ${user.email}`, emailResult.messageId);
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Course payment verification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
