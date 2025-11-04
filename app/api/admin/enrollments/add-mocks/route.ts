import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { enrollmentIds, mockIds } = body;

    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return NextResponse.json({ error: 'enrollmentIds array is required' }, { status: 400 });
    }

    if (!mockIds || !Array.isArray(mockIds) || mockIds.length === 0) {
      return NextResponse.json({ error: 'mockIds array is required' }, { status: 400 });
    }

    // Fetch enrollments with user details
    const enrollments = await prisma.enrollment.findMany({
      where: {
        id: { in: enrollmentIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    });

    // Fetch mock details
    const mocks = await prisma.mockTest.findMany({
      where: {
        id: { in: mockIds }
      },
      select: {
        id: true,
        title: true,
        price: true
      }
    });

    if (mocks.length === 0) {
      return NextResponse.json({ error: 'No valid mocks found' }, { status: 404 });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each enrollment
    for (const enrollment of enrollments) {
      try {
        // Create subscriptions for each mock
        const subscriptions = [];
        for (const mock of mocks) {
          // Check if subscription already exists
          const existingSubscription = await prisma.subscription.findFirst({
            where: {
              userId: enrollment.userId,
              mockTestId: mock.id,
              paid: true
            }
          });

          if (!existingSubscription) {
            // Create new subscription with actualAmountPaid = 0
            const subscription = await prisma.subscription.create({
              data: {
                userId: enrollment.userId,
                mockTestId: mock.id,
                razorpayOrderId: `admin_grant_${Date.now()}_${enrollment.userId}_${mock.id}`,
                razorpayPaymentId: `admin_payment_${Date.now()}`,
                paid: true,
                actualAmountPaid: 0, // Free grant by admin
                originalPrice: mock.price,
                discountApplied: mock.price, // Full discount
                couponCode: 'ADMIN_GRANT',
                paidAt: new Date()
              }
            });
            subscriptions.push(subscription);
          }
        }

        // Send email notification
        if (subscriptions.length > 0) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
                .mock-list { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
                .button { display: inline-block; padding: 12px 24px; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px; }
                .button-primary { background-color: #2563eb; }
                .button-success { background-color: #059669; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
                .brand { color: #667eea; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="content">
                  <h2 style="color: #2563eb;">Great News, ${enrollment.user.name || 'Student'}! 🎉</h2>
                  
                  <p>We're excited to inform you that <strong>${subscriptions.length} new mock test(s)</strong> have been added to your subscription at <strong>no additional cost</strong>!</p>
                  
                  <div class="mock-list">
                    <h3 style="margin-top: 0; color: #1f2937;">Newly Added Mocks:</h3>
                    <ul style="margin: 10px 0;">
                      ${mocks.map(m => `<li style="margin: 8px 0;"><strong>${m.title}</strong></li>`).join('')}
                    </ul>
                  </div>
                  
                  <p>These mocks have been specially added to enhance your learning experience as part of your <strong>${enrollment.course.title}</strong> enrollment.</p>
                  
                  <div style="margin: 30px 0;">
                    <p style="margin-bottom: 15px;"><strong>Access your new mocks now:</strong></p>
                    <div style="text-align: center;">
                      <a href="${appUrl}/mocks" class="button button-primary">View Mocks</a>
                      <a href="${appUrl}/redirecting" class="button button-success">Go to Dashboard</a>
                    </div>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Happy learning! If you have any questions, feel free to reach out to our support team.
                  </p>
                  
                  <p style="margin-top: 20px;">Best regards,<br>
                  <strong class="brand">Unfiltered IITians Team</strong><br>
                  <em>Divyanshu Darshna</em></p>
                </div>
                
                <div class="footer">
                  <p>© ${new Date().getFullYear()} <a href="https://divyanshudarshna.com" style="color: #667eea; text-decoration: none;">divyanshudarshna.com</a></p>
                  <p><strong>Unfiltered IITians</strong></p>
                  <p style="font-size: 11px; color: #999;">Divyanshu Darshna</p>
                  <p style="color: #9ca3af; font-size: 11px; margin-top: 15px;">
                    This is an automated notification. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail({
            to: enrollment.user.email,
            customSubject: `${subscriptions.length} New Mock${subscriptions.length > 1 ? 's' : ''} Added - ${enrollment.course.title}`,
            customHtml: emailHtml
          });

          results.push({
            userId: enrollment.userId,
            email: enrollment.user.email,
            name: enrollment.user.name,
            mocksAdded: subscriptions.length,
            status: 'success'
          });
          successCount++;
        } else {
          results.push({
            userId: enrollment.userId,
            email: enrollment.user.email,
            name: enrollment.user.name,
            mocksAdded: 0,
            status: 'skipped',
            reason: 'User already has all selected mocks'
          });
        }
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
        results.push({
          userId: enrollment.userId,
          email: enrollment.user.email,
          name: enrollment.user.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failureCount++;
      }
    }

    return NextResponse.json({
      message: `Successfully added mocks to ${successCount} student(s)`,
      summary: {
        total: enrollments.length,
        success: successCount,
        failed: failureCount,
        mockCount: mocks.length
      },
      results
    });

  } catch (error) {
    console.error('Error adding mocks to enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to add mocks' },
      { status: 500 }
    );
  }
}
