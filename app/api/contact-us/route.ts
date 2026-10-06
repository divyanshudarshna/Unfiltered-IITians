import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { randomUUID } from "node:crypto";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { readContactSubmission } from "@/lib/contact-submission";
import { ContactInputError, type ContactAttachment } from "@/lib/contact-attachments";
import { contactAttachmentLinks, removeContactAttachments, uploadContactAttachments } from "@/lib/contact-attachment-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

// Support conversations and attachment links are only listed for support staff.
export async function GET(req: Request) {
  try {
    await assertAdminApiAccess(new URL("/api/admin/contact-us/conversations", req.url).toString(), "GET");
    const contacts = await prisma.contactUs.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(contacts.map((contact) => ({ ...contact, attachments: contactAttachmentLinks(contact.attachments) })), { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("GET ContactUs error:", error)
    return new NextResponse("Failed to fetch contacts", { status: 500 })
  }
}


// POST new contact message
export async function POST(req: Request) {
  let uploaded: ContactAttachment[] = [];
  let saved = false;
  try {
    const { user_name, user_email, subject, message, threadId, parentId, files } = await readContactSubmission(req);

    // Check rate limiting - 3 messages per day per email
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messagesToday = await prisma.contactUs.count({
      where: {
        email: user_email,
        createdAt: {
          gte: today,
        },
      },
    });

    if (messagesToday >= 3) {
      return NextResponse.json(
        { 
          error: "Daily limit exceeded. You can send up to 3 messages per day through our contact form. Please try again tomorrow.",
          limitExceeded: true 
        },
        { status: 429 }
      );
    }

    const latestEmailMessage = await prisma.contactUs.findFirst({
      where: { email: user_email },
      orderBy: { createdAt: "desc" },
    });

    if (threadId && !await prisma.contactUs.findFirst({ where: { threadId, email: user_email } })) {
      return NextResponse.json({ error: "Conversation not found for this email." }, { status: 404 });
    }

    // Each email should map to one thread; reuse prior thread when available.
    const hasExistingConversation = !!latestEmailMessage;
    const isThreadReply = !!threadId || hasExistingConversation;
    let finalThreadId = threadId || latestEmailMessage?.threadId;

    // Generate a thread for brand new inquiries or legacy rows without threadId.
    if (!finalThreadId) {
      finalThreadId = `thread_${randomUUID()}`;
    }

    if (hasExistingConversation) {
      await prisma.contactUs.updateMany({
        where: {
          email: user_email,
          threadId: null,
        },
        data: {
          threadId: finalThreadId,
        },
      });
    }

    // Add quoted message if it's a reply to a thread
    let finalMessage = message;
    const finalParentId = parentId || latestEmailMessage?.id;
    if (parentId && !await prisma.contactUs.findFirst({ where: { id: parentId, threadId: finalThreadId } })) {
      return NextResponse.json({ error: "Parent message not found in this conversation." }, { status: 400 });
    }

    if (isThreadReply && finalParentId) {
      const parentMessage = await prisma.contactUs.findFirst({
        where: { id: finalParentId, threadId: finalThreadId },
      });
      if (parentMessage) {
        finalMessage = `${message}\n\n------- Previous Message -------\n${parentMessage.message}`;
      }
    }

    uploaded = await uploadContactAttachments(files);
    // Save to database
    const contact = await prisma.contactUs.create({
      data: { 
        name: user_name, 
        email: user_email, 
        subject: subject!,
        message: finalMessage,
        ...(uploaded.length ? { attachments: uploaded } : {}),
        status: "PENDING",
        threadId: finalThreadId,
        parentId: finalParentId || undefined,
        conversationType: isThreadReply ? "USER_REPLY" : "NEW_INQUIRY",
        dailyMessageCount: messagesToday + 1,
        lastMessageDate: new Date(),
      },
    });
    saved = true;

    return NextResponse.json({ 
      success: true, 
      message: "Contact form submitted successfully",
      data: { ...contact, attachments: contactAttachmentLinks(contact.attachments) },
      threadId: finalThreadId,
    });
  } catch (error) {
    if (!saved) await removeContactAttachments(uploaded);
    if (error instanceof ContactInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("POST ContactUs error:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
