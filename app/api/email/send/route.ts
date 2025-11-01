import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, verifyEmailConfig, type EmailTemplate } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      to,
      template,
      data,
      customSubject,
      customHtml,
    } = body;

    // Validation
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if either template or custom email is provided
    if (!template && (!customSubject || !customHtml)) {
      return NextResponse.json(
        { error: 'Either provide a template or customSubject with customHtml' },
        { status: 400 }
      );
    }

    // Validate template if provided
    const validTemplates: EmailTemplate[] = [
      'welcome',
      'course_purchase',
      'mock_purchase',
      'guidance_session',
      'subscription',
      'custom'
    ];

    if (template && !validTemplates.includes(template)) {
      return NextResponse.json(
        { 
          error: 'Invalid template', 
          validTemplates 
        },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendEmail({
      to,
      template: template as EmailTemplate,
      data,
      customSubject,
      customHtml,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in email API:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// GET endpoint to verify email configuration
export async function GET() {
  try {
    const result = await verifyEmailConfig();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error verifying email config:', error);
    return NextResponse.json(
      { error: 'Failed to verify email configuration' },
      { status: 500 }
    );
  }
}
