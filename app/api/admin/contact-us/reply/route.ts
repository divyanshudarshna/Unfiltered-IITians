import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { stripQuotedHistory } from "@/lib/contact-conversations";

type ReplyBody = {
  rootContactId: string;
  threadId?: string | null;
  to: string;
  userName: string;
  subject: string;
  message: string;
  status?: "PENDING" | "RESOLVED" | "DELETED";
};

export async function POST(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const body = (await req.json()) as ReplyBody;
    const { rootContactId, threadId, to, userName, subject, message, status } = body;

    if (!rootContactId || !to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: rootContactId, to, subject, message" },
        { status: 400 }
      );
    }

    const rootContact = await prisma.contactUs.findUnique({
      where: { id: rootContactId },
    });

    if (!rootContact) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    let finalThreadId = threadId || rootContact.threadId;

    if (!finalThreadId) {
      finalThreadId = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await prisma.contactUs.update({
        where: { id: rootContact.id },
        data: { threadId: finalThreadId },
      });
    }

    const threadMessages = await prisma.contactUs.findMany({
      where: { threadId: finalThreadId },
      orderBy: { createdAt: "asc" },
    });

    const allMessages = threadMessages.length > 0 ? threadMessages : [rootContact];

    let conversationHistory = "\n\n------- Conversation History -------\n";
    for (const msg of allMessages) {
      const typeLabel =
        msg.conversationType === "NEW_INQUIRY"
          ? "Original Inquiry"
          : msg.conversationType === "ADMIN_REPLY"
            ? "Admin Reply"
            : "User Reply";

      conversationHistory += `\n[${typeLabel}] - ${new Date(msg.createdAt).toLocaleString("en-IN")}:\n${stripQuotedHistory(msg.message)}\n`;
    }

    const fullAdminMessage = `${message}${conversationHistory}`;

    const adminReply = await prisma.contactUs.create({
      data: {
        name: "Admin",
        email: process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@unfilterediitians.com",
        subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
        message: fullAdminMessage,
        status: status || "RESOLVED",
        threadId: finalThreadId,
        parentId: rootContact.id,
        conversationType: "ADMIN_REPLY",
      },
    });

    await prisma.contactUs.updateMany({
      where: {
        threadId: finalThreadId,
        conversationType: { in: ["NEW_INQUIRY", "USER_REPLY"] },
      },
      data: {
        status: status || "RESOLVED",
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const replyUrl = `${baseUrl}/contact/reply?threadId=${finalThreadId}&email=${encodeURIComponent(
      to
    )}&name=${encodeURIComponent(userName || "User")}`;

    const customHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(120deg, #0f172a 0%, #1d4ed8 100%); color: white; padding: 26px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; }
          .message-box { background: white; padding: 16px; border-left: 4px solid #2563eb; border-radius: 8px; margin: 18px 0; white-space: pre-wrap; }
          .button { display: inline-block; padding: 10px 22px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; margin-top: 10px; }
          .reply { background: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Update on your inquiry</h1>
          </div>
          <div class="content">
            <p>Hello ${userName || "there"},</p>
            <div class="message-box">${message}</div>
            <p>You can continue this conversation using the reply button below:</p>
            <a href="${replyUrl}" class="button reply">Reply to this message</a>
            <br />
            <a href="${baseUrl}/contact" class="button">Start new inquiry</a>
            <p style="margin-top:16px;">Regards,<br /><strong>Unfiltered IITians Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to,
      customSubject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
      customHtml,
      source: "contact-us",
      sentBy: "Admin",
      metadata: {
        threadId: finalThreadId,
        rootContactId,
        contactId: adminReply.id,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
      data: adminReply,
      threadId: finalThreadId,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error sending admin contact reply:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
