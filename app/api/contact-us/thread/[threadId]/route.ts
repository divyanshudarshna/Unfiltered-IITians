import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/contact-us/thread/[threadId]
 * Fetch conversation thread details
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;

    if (!threadId) {
      return NextResponse.json(
        { error: "Thread ID is required" },
        { status: 400 }
      );
    }

    console.log('📖 Fetching thread:', threadId);

    // Fetch all messages in the thread
    const messages = await prisma.contactUs.findMany({
      where: {
        threadId: threadId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    // Get the original inquiry (first message in thread)
    const originalInquiry = messages.find(m => m.conversationType === 'NEW_INQUIRY') || messages[0];

    console.log('✅ Found thread with', messages.length, 'messages');

    return NextResponse.json({
      success: true,
      threadId: threadId,
      originalInquiry: {
        id: originalInquiry.id,
        name: originalInquiry.name,
        email: originalInquiry.email,
        subject: originalInquiry.subject,
        message: originalInquiry.message,
        createdAt: originalInquiry.createdAt,
      },
      messages: messages.map(msg => ({
        id: msg.id,
        name: msg.name,
        email: msg.email,
        subject: msg.subject,
        message: msg.message,
        conversationType: msg.conversationType,
        createdAt: msg.createdAt,
        status: msg.status,
      })),
      latestMessage: messages[messages.length - 1],
    });
  } catch (error) {
    console.error("❌ Error fetching thread:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}
