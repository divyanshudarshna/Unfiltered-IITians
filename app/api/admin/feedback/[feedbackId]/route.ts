import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { feedbackId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth(req);
    if (!clerkUserId) 
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check admin role
    const admin = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!admin || admin.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { feedbackId } = params;
    if (!feedbackId)
      return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });

    // Delete replies and recipients first
    await prisma.feedbackReplyRecipient.deleteMany({
      where: { reply: { feedbackId } },
    });
    await prisma.feedbackReply.deleteMany({ where: { feedbackId } });

    // Delete the feedback
    const deletedFeedback = await prisma.courseFeedback.delete({
      where: { id: feedbackId },
    });

    return NextResponse.json({ success: true, deletedFeedback });
  } catch (err: any) {
    console.error("Error deleting feedback:", err);
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
