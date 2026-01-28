import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess } from "@/lib/roleAuth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { feedbackId: string } }
) {
  try {
    await assertAdminApiAccess(req.url, req.method);

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
