import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrollmentIds, subject, message } = body;

    if (!enrollmentIds || !Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Enrollment IDs are required' },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Fetch enrollments with user details
    const enrollments = await prisma.sessionEnrollment.findMany({
      where: {
        id: { in: enrollmentIds },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        session: {
          select: {
            title: true,
          },
        },
      },
    });

    // Send emails
    const emailPromises = enrollments.map(async (enrollment) => {
      const customHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Unfiltered IITians</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Session Update</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${enrollment.user.name || 'there'},</p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
              ${message.replaceAll('\n', '<br>')}
            </p>

            <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
              <p style="color: #333; font-size: 14px; margin: 0;"><strong>Session:</strong> ${enrollment.session.title}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/guidance" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                View Sessions
              </a>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              © ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.
            </p>
          </div>
        </div>
      `;

      return sendEmail({
        to: enrollment.user.email,
        customSubject: subject,
        customHtml,
        source: 'session-enrollments',
        sentBy: request.headers.get('x-user-email') || 'Admin',
        metadata: {
          sessionId,
          enrollmentId: enrollment.id,
          recipientCount: enrollments.length,
        },
      });
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Email sent to ${enrollments.length} student(s)`,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
