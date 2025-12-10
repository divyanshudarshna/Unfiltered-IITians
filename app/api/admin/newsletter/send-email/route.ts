import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emails, subject, message } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "No email recipients provided" },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Get base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Create custom HTML with the email.ts footer template style
    const customHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 20px 0; white-space: pre-wrap; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .button-secondary { background: #11998e; }
          .button-third { background: #f5576c; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .brand { color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Message from Unfiltered IITians</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            
            <div class="message-box">
              ${message}
            </div>
            
            <h3>🚀 Explore Our Platform</h3>
            <p>Continue your learning journey with us:</p>
            
            <center>
              <a href="${baseUrl}/resources" class="button">
                📖 Free Resources
              </a>
              <a href="${baseUrl}/mocks" class="button button-third">
                📝 Mock Tests
              </a>
              <a href="${baseUrl}/courses" class="button button-secondary">
                🎓 Browse Courses
              </a>
            </center>
            
            <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us!</p>
            
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

    // Send emails to all recipients
    const emailPromises = emails.map(async (email: string) => {
      try {
        const result = await sendEmail({
          to: email,
          customSubject: subject,
          customHtml,
          source: 'newsletter',
          sentBy: req.headers.get('x-user-email') || 'Admin',
          metadata: {
            recipientCount: emails.length,
            isNewsletter: true,
          },
        });
        return { email, success: result.success, error: result.error };
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        return { 
          email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const results = await Promise.all(emailPromises);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Sent ${successCount} emails successfully`);
    if (failedCount > 0) {
      console.error(`❌ Failed to send ${failedCount} emails`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${successCount} email(s)`,
      successCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error("Error sending newsletter emails:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
