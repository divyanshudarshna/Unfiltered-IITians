// app/api/feedback/reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find the logged-in user
    const student = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!student) return NextResponse.json({ feedbacks: [] });

    // Fetch feedbacks for this student
    const feedbacks = await prisma.courseFeedback.findMany({
      where: { userId: student.id },
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            admin: { select: { id: true, name: true, email: true } },
            // Include recipient info for the logged-in student
            recipients: {
              where: { userId: student.id },
              select: { id: true, read: true, readAt: true },
            },
          },
        },
      },
    });

    // Map replies to include recipient info as expected by client
    const formattedFeedbacks = feedbacks.map((f) => ({
      id: f.id,
      content: f.content,
      createdAt: f.createdAt,
      replies: f.replies.map((r) => ({
        id: r.id,
        message: r.message,
        createdAt: r.createdAt,
        admin: r.admin,
        recipient: r.recipients[0] ?? null, // Only 1 recipient per student
      })),
    }));

    return NextResponse.json({ feedbacks: formattedFeedbacks });
  } catch (err) {
    console.error("Error fetching feedback replies:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
