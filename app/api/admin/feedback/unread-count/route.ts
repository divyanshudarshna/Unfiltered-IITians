// app/api/admin/feedback/unread-count/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

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
    console.error("Error fetching unread feedback count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}