// app/api/admin/feedback/reply/[replyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: NextRequest, { params }: { params: { replyId: string } }) {
  try {
    const { userId: clerkUserId } = await auth(req);
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if the user is admin
    const admin = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { replyId } = params;
    if (!replyId) return NextResponse.json({ error: "Reply ID is required" }, { status: 400 });

    // Delete the reply and all its recipients
    const deletedReply = await prisma.feedbackReply.delete({
      where: { id: replyId },
    });

    return NextResponse.json({ success: true, deletedReply });
  } catch (err: any) {
    console.error("Error deleting reply:", err);
    if (err.code === "P2025") {
      // Prisma error: record not found
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
