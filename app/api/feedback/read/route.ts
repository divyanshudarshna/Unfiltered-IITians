// app/api/feedback/read/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { replyId } = await req.json();
    if (!replyId) {
      return new NextResponse("Missing replyId", { status: 400 });
    }

    // Map Clerk ID → internal User ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
      select: { id: true },
    });

    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    // Mark feedback reply as read
    await prisma.feedbackReplyRecipient.updateMany({
      where: { replyId, userId: dbUser.id },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/feedback/read error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
