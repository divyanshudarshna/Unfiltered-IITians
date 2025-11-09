import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingSubscription = await prisma.newsletter.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 409 }
      );
    }

    // Create new subscription
    const subscription = await prisma.newsletter.create({
      data: {
        email: email.toLowerCase(),
      },
    });

    // Send welcome email to subscriber
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      const customHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .button-secondary { background: #11998e; }
            .button-third { background: #f5576c; }
            .feature-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .brand { color: #667eea; font-weight: bold; }
            .emoji { font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🎉</div>
              <h1>Welcome to Unfiltered IITians Newsletter!</h1>
              <p>Thank you for subscribing!</p>
            </div>
            <div class="content">
              <h2>Hello There! 👋</h2>
              <p>We're thrilled to have you join our community of ambitious learners and future IITians!</p>
              
              <p>You're now subscribed to receive:</p>
              <ul>
                <li>📚 Exclusive study materials and tips</li>
                <li>🎯 Exam preparation strategies</li>
                <li>🆕 Latest course updates and announcements</li>
                <li>🎁 Special offers and early access to new content</li>
                <li>💡 Success stories and motivational content</li>
              </ul>

              <div class="feature-box">
                <h3>🚀 Get Started Today!</h3>
                <p>Explore our platform and make the most of your learning journey:</p>
              </div>

              <center>
                <a href="${baseUrl}/resources" class="button">
                  📖 Free Resources
                </a>
                <a href="${baseUrl}/mocks" class="button button-third">
                  📝 Free Mock Tests
                </a>
                <a href="${baseUrl}/courses" class="button button-secondary">
                  🎓 Browse Courses
                </a>
              </center>

              <div class="feature-box">
                <h3>✨ What's Available?</h3>
                <p><strong>Free Resources:</strong> Access quality study materials, notes, and guides to boost your preparation.</p>
                <p><strong>Mock Tests:</strong> Practice with comprehensive mock tests designed to simulate real exam conditions.</p>
                <p><strong>Premium Courses:</strong> Enroll in our expertly crafted courses for in-depth learning and guidance.</p>
              </div>

              <p><strong>Need Help?</strong><br>
              Our support team is here for you. Feel free to reach out at any time!</p>
              
              <p>Best regards,<br>
              <strong class="brand">Unfiltered IITians</strong><br>
              <em>by Divyanshu Darshna</em></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
              <p>You received this email because you subscribed to our newsletter.</p>
              <p>
                <a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit Website</a> | 
                <a href="${baseUrl}/courses" style="color: #667eea; text-decoration: none;">Browse Courses</a> | 
                <a href="${baseUrl}/contact" style="color: #667eea; text-decoration: none;">Contact Us</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: email.toLowerCase(),
        customSubject: '🎉 Welcome to Unfiltered IITians Newsletter!',
        customHtml,
      });

      console.log('✅ Newsletter welcome email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send newsletter welcome email:', emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter!', subscription },
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}