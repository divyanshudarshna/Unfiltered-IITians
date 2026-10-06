import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { groupContactsIntoConversations } from "@/lib/contact-conversations";
import { contactAttachmentLinks } from "@/lib/contact-attachment-storage";

export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const contacts = await prisma.contactUs.findMany({
      orderBy: { createdAt: "asc" },
    });

    const conversations = groupContactsIntoConversations(contacts).map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => ({ ...message, attachments: contactAttachmentLinks(message.attachments) })),
    }));

    return NextResponse.json({
      conversations,
      total: conversations.length,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error fetching admin contact conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact conversations" },
      { status: 500 }
    );
  }
}
