import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, message, userName, status } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Get status badge color
    const getStatusBadge = (status: string) => {
      switch (status) {
        case "RESOLVED":
          return { color: "#10b981", text: "Resolved", emoji: "✅" };
        case "PENDING":
          return { color: "#f59e0b", text: "Pending", emoji: "⏳" };
        default:
          return { color: "#667eea", text: "Updated", emoji: "📝" };
      }
    };

    const statusInfo = getStatusBadge(status);

    // Create custom HTML with footer template
    const customHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; background: ${statusInfo.color}; color: white; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .message-box { background: white; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .brand { color: #667eea; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusInfo.emoji} Contact Inquiry Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName || 'there'}!</h2>
            
            <div class="status-badge">
              Status: ${statusInfo.text}
            </div>
            
            <div class="message-box">
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            
            <p>If you have any further questions, feel free to reach out to us anytime.</p>
            
            <center>
              <a href="${baseUrl}/contact" class="button">Contact Us Again</a>
            </center>
            
            <p>Best regards,<br>
            <strong class="brand">Unfiltered IITians</strong><br>
            <em>by Divyanshu Darshna</em></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
            <p>This email was sent in response to your inquiry.</p>
            <p><a href="${baseUrl}" style="color: #667eea; text-decoration: none;">Visit Website</a> | <a href="${baseUrl}/courses" style="color: #667eea; text-decoration: none;">Browse Courses</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const result = await sendEmail({
      to,
      customSubject: subject,
      customHtml,
      source: 'contact-us',
      sentBy: req.headers.get('x-admin-email') || 'Admin',
      metadata: {
        recipientEmail: to,
        status: status,
        userName: userName
      }
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending contact email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
