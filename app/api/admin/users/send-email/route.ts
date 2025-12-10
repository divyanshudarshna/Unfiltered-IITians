import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userIds, subject, message } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "No users selected" },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Fetch user emails
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        email: true,
        name: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No valid users found" },
        { status: 404 }
      );
    }

    // Get base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Send emails to all users
    const emailPromises = users.map(async (user) => {
      try {
        // Create custom HTML with personalization
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
                <h2>Hello ${user.name || 'Student'}!</h2>
                
                <div class="message-box">
                  ${message}
                </div>
                
                <h3>🚀 Explore Our Platform</h3>
                <p>Continue your learning journey with us:</p>
                
                <center>
                  <a href="${baseUrl}/redirecting" class="button">
                    🏠 Go to Dashboard
                  </a>
                  <a href="${baseUrl}/courses" class="button button-secondary">
                    🎓 Browse Courses
                  </a>
                  <a href="${baseUrl}/mocks" class="button button-third">
                    📝 Mock Tests
                  </a>
                </center>
                
                <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us!</p>
                
                <p>Best regards,<br>
                <strong class="brand">Unfiltered IITians</strong><br>
                <em>by Divyanshu Darshna</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Unfiltered IITians by Divyanshu Darshna. All rights reserved.</p>
                <p>You received this email as a registered user of our platform.</p>
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

        const result = await sendEmail({
          to: user.email,
          customSubject: subject,
          customHtml,
          // Don't log individual emails - we'll log the batch below
        });
        
        return { 
          email: user.email, 
          name: user.name,
          success: result.success, 
          error: result.error 
        };
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        return { 
          email: user.email,
          name: user.name,
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

    // Log the batch email send to database
    if (successCount > 0) {
      try {
        const successfulEmails = results.filter(r => r.success).map(r => r.email);
        
        await prisma.emailLog.create({
          data: {
            subject,
            body: message,
            recipients: successfulEmails,
            recipientCount: successCount,
            sentBy: req.headers.get('x-admin-email') || 'Admin',
            source: 'admin-users',
            metadata: {
              totalAttempted: users.length,
              successCount,
              failedCount,
              userIds
            }
          }
        });
        console.log('📧 Email batch logged to database');
      } catch (logError) {
        console.error('Failed to log email batch to database:', logError);
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${successCount} email(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      successCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error("Error sending user emails:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
