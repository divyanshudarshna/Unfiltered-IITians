import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, message, userName, status, contactId, threadId } = body;

    console.log('📧 Contact-us send-email API called:', { to, subject, userName, status, contactId, threadId });

    if (!to || !subject || !message) {
      console.error('❌ Missing required fields:', { to: !!to, subject: !!subject, message: !!message });
      return NextResponse.json(
        { error: "Missing required fields: to, subject, message" },
        { status: 400 }
      );
    }

    // Get the contact record to retrieve threadId if not provided
    let finalThreadId = threadId;
    if (contactId && !finalThreadId) {
      try {
        const contact = await prisma.contactUs.findUnique({
          where: { id: contactId },
        });
        if (contact) {
          finalThreadId = contact.threadId;
          console.log('✅ Retrieved threadId from contact:', finalThreadId);
        } else {
          console.error('⚠️ Contact not found for ID:', contactId);
        }
      } catch (error) {
        console.error('⚠️ Failed to retrieve contact:', error);
      }
    }

    // Generate a new threadId if still missing (for contacts created before threading was added)
    if (!finalThreadId && contactId) {
      finalThreadId = `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      console.log('🆕 Generated new threadId for legacy contact:', finalThreadId);
      try {
        await prisma.contactUs.update({
          where: { id: contactId },
          data: { threadId: finalThreadId },
        });
        console.log('✅ Updated original contact with new threadId');
      } catch (updateError) {
        console.error('⚠️ Failed to update contact with threadId:', updateError);
      }
    }

    // Warn if threadId is still missing
    if (!finalThreadId) {
      console.warn('⚠️ No threadId available! User will not be able to reply to this conversation.');
    }

    // Get base URL for links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Create reply URL with thread information and user details for prefilling
    const replyUrl = finalThreadId 
      ? `${baseUrl}/contact/reply?threadId=${finalThreadId}&email=${encodeURIComponent(to)}&name=${encodeURIComponent(userName || 'User')}`
      : `${baseUrl}/contact`;
    
    console.log('🔗 Reply URL generated:', replyUrl, { finalThreadId, to, userName });

    // Get status badge color
    const getStatusBadge = (statusVal: string | undefined) => {
      switch (statusVal) {
        case "RESOLVED":
          return { color: "#10b981", text: "Resolved", emoji: "✅" };
        case "PENDING":
          return { color: "#f59e0b", text: "Pending", emoji: "⏳" };
        default:
          return { color: "#667eea", text: "Updated", emoji: "📝" };
      }
    };

    const statusInfo = getStatusBadge(status);

    // Create ADMIN_REPLY entry in database with full conversation history
    if (contactId && finalThreadId) {
      try {
        // Fetch all messages in the thread for conversation history
        const allThreadMessages = await prisma.contactUs.findMany({
          where: {
            threadId: finalThreadId,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        // Build conversation history string
        let conversationHistory = '\n\n------- Conversation History -------\n';
        allThreadMessages.forEach((msg) => {
          const typeLabel = msg.conversationType === 'NEW_INQUIRY' ? 'Original Inquiry' : 
                           msg.conversationType === 'ADMIN_REPLY' ? 'Admin Reply' : 'User Reply';
          conversationHistory += `\n[${typeLabel}] - ${new Date(msg.createdAt).toLocaleString('en-IN')}:\n${msg.message.split('\n\n-------')[0]}\n`;
        });

        // Create the admin reply with full conversation history
        const fullAdminMessage = `${message}${conversationHistory}`;

        await prisma.contactUs.create({
          data: {
            name: 'Admin',
            email: 'Support@divyanshudarshna.com',
            subject: `Re: ${subject}`,
            message: fullAdminMessage,
            status: 'RESOLVED',
            threadId: finalThreadId,
            parentId: contactId,
            conversationType: 'ADMIN_REPLY',
          },
        });
        console.log('✅ Created ADMIN_REPLY entry in database with conversation history');
      } catch (dbError) {
        console.error('⚠️ Failed to create ADMIN_REPLY entry:', dbError);
        // Continue with email sending even if database entry fails
      }
    }

    // Create custom HTML with reply button
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
          .reply-button { background: #10b981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .brand { color: #667eea; font-weight: bold; }
          .reply-notice { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 5px; }
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
            
            <div class="reply-notice">
              <strong>💬 Have a follow-up question?</strong>
              <p style="margin: 10px 0;">You can reply directly to this message by clicking the button below. Your response will be added to this conversation thread.</p>
            </div>
            
            <center>
              <a href="${replyUrl}" class="button reply-button">Reply to this Message</a>
              <a href="${baseUrl}/contact" class="button">Start New Inquiry</a>
            </center>
            
            <p style="margin-top: 20px;">Best regards,<br>
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
    console.log('📨 Attempting to send email to:', to);
    const result = await sendEmail({
      to,
      customSubject: subject,
      customHtml,
      source: 'contact-us',
      sentBy: req.headers.get('x-admin-email') || 'Admin',
      metadata: {
        recipientEmail: to,
        status: status || 'PENDING',
        userName: userName || 'User',
        threadId: finalThreadId || null,
        contactId: contactId || null,
      }
    });

    if (result.success) {
      console.log('✅ Email sent successfully to:', to);
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      });
    } else {
      console.error('❌ Email sending failed:', result.error);
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error in contact-us send-email API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
