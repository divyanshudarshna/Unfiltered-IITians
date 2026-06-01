import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET all contact messages (⚠️ later protect for admin only)
export async function GET() {
  try {
    const contacts = await prisma.contactUs.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("GET ContactUs error:", error)
    return new NextResponse("Failed to fetch contacts", { status: 500 })
  }
}


// POST new contact message
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_name, user_email, subject, message, threadId, parentId } = body;

    // Validate required fields
    if (!user_name || !user_email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Each email should map to one thread; reuse prior thread when available.
    const hasExistingConversation = !!latestEmailMessage;
    const isThreadReply = !!threadId || hasExistingConversation;
    let finalThreadId = threadId || latestEmailMessage?.threadId;

    // Generate a thread for brand new inquiries or legacy rows without threadId.
    if (!finalThreadId) {
      finalThreadId = `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;
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

    if (isThreadReply && finalParentId) {
      const parentMessage = await prisma.contactUs.findUnique({
        where: { id: finalParentId },
      });
      if (parentMessage) {
        finalMessage = `${message}\n\n------- Previous Message -------\n${parentMessage.message}`;
      }
    }

    // Save to database
    const contact = await prisma.contactUs.create({
      data: { 
        name: user_name, 
        email: user_email, 
        subject, 
        message: finalMessage,
        status: "PENDING",
        threadId: finalThreadId,
        parentId: finalParentId || undefined,
        conversationType: isThreadReply ? "USER_REPLY" : "NEW_INQUIRY",
        dailyMessageCount: messagesToday + 1,
        lastMessageDate: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Contact form submitted successfully",
      data: contact,
      threadId: finalThreadId,
    });
  } catch (error) {
    console.error("POST ContactUs error:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
