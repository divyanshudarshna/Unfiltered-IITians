import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { groupContactsIntoConversations } from "@/lib/contact-conversations";

export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const contacts = await prisma.contactUs.findMany({
      orderBy: { createdAt: "asc" },
    });

    const conversations = groupContactsIntoConversations(contacts);

    return NextResponse.json({
      conversations,
      total: conversations.length,
    });
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
