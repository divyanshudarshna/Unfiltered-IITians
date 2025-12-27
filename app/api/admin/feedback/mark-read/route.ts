import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { feedbackId, markAll } = body;

    if (markAll) {
      // Mark all PENDING feedbacks as RESOLVED
      const result = await prisma.courseFeedback.updateMany({
        where: { status: "PENDING" },
        data: { status: "RESOLVED" }
      });

      return NextResponse.json({ 
        success: true, 
        message: `Marked ${result.count} feedbacks as read`,
        count: result.count
      });
    } else if (feedbackId) {
      // Mark single feedback as RESOLVED
      const feedback = await prisma.courseFeedback.update({
        where: { id: feedbackId },
        data: { status: "RESOLVED" }
      });

      return NextResponse.json({ 
        success: true, 
        message: "Feedback marked as read",
        feedback
      });
    } else {
      return NextResponse.json(
        { error: "Either feedbackId or markAll must be provided" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error marking feedback as read:", error);
    return NextResponse.json(
      { error: "Failed to mark feedback as read" },
      { status: 500 }
    );
  }
}
