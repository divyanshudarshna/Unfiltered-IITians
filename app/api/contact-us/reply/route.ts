import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/contact-us/reply
 * Handles user replies to admin emails - creates threaded conversation
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { threadId, parentId, user_name, user_email, message } = body;

    // Validate required fields
    if (!threadId || !user_email || !message || !user_name) {
      return NextResponse.json(
        { error: "Missing required fields: threadId, user_email, message, user_name" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify thread exists
    const threadExists = await prisma.contactUs.findFirst({
      where: {
        threadId: threadId,
      },
    });

    if (!threadExists) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    // Fetch all messages in the thread for conversation history
    const allThreadMessages = await prisma.contactUs.findMany({
      where: {
        threadId: threadId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Check rate limiting - 3 messages per day per email
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messagesToday = await prisma.contactUs.count({
      where: {
        email: user_email,
        conversationType: "USER_REPLY",
        createdAt: {
          gte: today,
        },
      },
    });

    if (messagesToday >= 3) {
      return NextResponse.json(
        { 
          error: "Daily limit exceeded. You can send up to 3 messages per day. Please try again tomorrow.",
          limitExceeded: true 
        },
        { status: 429 }
      );
    }

    // Build conversation history string
    let conversationHistory = '\n\n------- Conversation History -------\n';
    allThreadMessages.forEach((msg, index) => {
      const typeLabel = msg.conversationType === 'NEW_INQUIRY' ? 'Original Inquiry' : 
                       msg.conversationType === 'ADMIN_REPLY' ? 'Admin Reply' : 'User Reply';
      conversationHistory += `\n[${typeLabel}] - ${new Date(msg.createdAt).toLocaleString('en-IN')}:\n${msg.message}\n`;
    });

    // Create the reply with full conversation history
    const fullMessage = `${message}${conversationHistory}`;

    const reply = await prisma.contactUs.create({
      data: {
        name: user_name,
        email: user_email,
        subject: `Re: ${threadExists.subject}`,
        message: fullMessage,
        status: "PENDING",
        threadId: threadId,
        parentId: parentId || undefined,
        conversationType: "USER_REPLY",
        dailyMessageCount: messagesToday + 1,
        lastMessageDate: new Date(),
      },
    });

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Send notification email to admin with full conversation
    const adminEmail = process.env.ADMIN_EMAIL || "divyanshudarshna@gmail.com";
    
    // Build conversation history HTML
    let conversationHistoryHtml = '';
    allThreadMessages.forEach((msg) => {
      const typeLabel = msg.conversationType === 'NEW_INQUIRY' ? '📩 Original Inquiry' : 
                       msg.conversationType === 'ADMIN_REPLY' ? '💬 Admin Reply' : '✉️ User Reply';
      const bgColor = msg.conversationType === 'ADMIN_REPLY' ? '#f3e8ff' : 
                     msg.conversationType === 'USER_REPLY' ? '#e0f2fe' : '#dbeafe';
      
      conversationHistoryHtml += `
        <div style="background: ${bgColor}; padding: 15px; border-left: 3px solid #667eea; margin: 10px 0; border-radius: 5px;">
          <strong>${typeLabel}</strong> - <small>${new Date(msg.createdAt).toLocaleString('en-IN')}</small>
          <p style="white-space: pre-wrap; margin-top: 8px; font-size: 0.9em;">${msg.message.split('\n\n-------')[0]}</p>
        </div>
      `;
    });
    
    const adminNotificationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; border-left: 4px solid #10b981; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          .brand { color: #667eea; font-weight: bold; }
          .conversation-section { margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 New Reply from User</h1>
          </div>
          <div class="content">
            <h2>User replied to: ${threadExists.subject}</h2>
            
            <p><strong>From:</strong> ${user_name} (${user_email})</p>
            <p><strong>Thread ID:</strong> ${threadId}</p>
            <p><strong>Type:</strong> <span style="background: #0ea5e9; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85em;">USER_REPLY</span></p>
            
            <div class="message-box">
              <strong>Latest Reply:</strong>
              <p style="white-space: pre-wrap; margin-top: 10px;">${message}</p>
            </div>
            
            <div class="conversation-section">
              <h3>📝 Full Conversation Thread:</h3>
              ${conversationHistoryHtml}
            </div>
            
            <center>
              <a href="${baseUrl}/admin/contact-us" class="button">View & Reply in Admin Panel</a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: adminEmail,
      customSubject: `[Reply] ${threadExists.subject}`,
      customHtml: adminNotificationHtml,
      source: 'contact-reply',
      sentBy: user_email,
      metadata: {
        threadId,
        parentId,
        contactId: reply.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
      data: reply,
    });
  } catch (error) {
    console.error("POST ContactUs Reply error:", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
