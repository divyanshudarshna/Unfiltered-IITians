// app/api/admin/feedback/unread-count/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

export async function GET(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    // Count pending feedbacks (feedbacks without replies)
    const unreadFeedbackCount = await prisma.courseFeedback.count({
      where: {
        status: "PENDING",
        replies: {
          none: {} // No replies yet
        }
      }
    });

    return NextResponse.json({ 
      count: unreadFeedbackCount 
    });

  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error fetching unread feedback count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}