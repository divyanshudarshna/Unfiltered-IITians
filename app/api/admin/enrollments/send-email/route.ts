import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import * as Email from '@/lib/email';

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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { enrollmentIds, subject, message, courseId } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // If courseId is provided, get all enrollments for that course
    let targetEnrollmentIds = enrollmentIds || [];
    
    if (courseId && courseId !== 'all' && (!enrollmentIds || enrollmentIds.length === 0)) {
      const courseEnrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: { id: true }
      });
      targetEnrollmentIds = courseEnrollments.map(e => e.id);
    }

    if (!targetEnrollmentIds || targetEnrollmentIds.length === 0) {
      return NextResponse.json({ error: 'No enrollments selected' }, { status: 400 });
    }

    // Fetch enrollment details with user email
    const enrollments = await prisma.enrollment.findMany({
      where: {
        id: { in: targetEnrollmentIds }
      },
      include: {
        user: {
          select: {
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

    console.log('📧 Sending emails to', enrollments.length, 'students');

    // Send emails to all selected students
    const results = [];
    for (const enrollment of enrollments) {
      try {
        const emailResult = await Email.sendEmail({
          to: enrollment.user.email,
          customSubject: subject,
          customHtml: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
                .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
                .brand { color: #667eea; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="content">
                  <h2>Hello ${enrollment.user.name || 'Student'}!</h2>
                  <p><strong>Course:</strong> ${enrollment.course.title}</p>
                  
                  <div class="message-box">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                  
                  <p>Best regards,<br>
                  <strong class="brand">Unfiltered IITians Team</strong><br>
                  <em>Divyanshu Darshna</em></p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} <a href="https://divyanshudarshna.com" style="color: #667eea; text-decoration: none;">divyanshudarshna.com</a></p>
                  <p><strong>Unfiltered IITians</strong></p>
                  <p style="font-size: 11px; color: #999;">Divyanshu Darshna</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        
        results.push({
          email: enrollment.user.email,
          success: emailResult.success,
          error: emailResult.error
        });
        
        console.log(`Email sent to ${enrollment.user.email}:`, emailResult.success ? '✅' : '❌');
      } catch (error) {
        console.error(`Failed to send email to ${enrollment.user.email}:`, error);
        results.push({
          email: enrollment.user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} emails successfully, ${failureCount} failed`,
      results,
      summary: {
        total: enrollments.length,
        success: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error sending emails to enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to send emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
