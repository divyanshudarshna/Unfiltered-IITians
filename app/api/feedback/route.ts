import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, content } = await req.json();
    if (!courseId || !content) {
      return NextResponse.json({ error: "courseId and content are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const feedback = await prisma.courseFeedback.create({
      data: {
        courseId,
        userId: user.id,
        content,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Optional: GET for student's feedback
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const student = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!student) return NextResponse.json({ feedbacks: [] });

    const feedbacks = await prisma.courseFeedback.findMany({
      where: { userId: student.id },
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            admin: { select: { id: true, name: true, email: true } },
            recipients: {
              where: { userId: student.id },
              select: { read: true },
            },
          },
        },
      },
    });

    const formattedFeedbacks = feedbacks.map((f) => ({
      id: f.id,
      content: f.content,
      createdAt: f.createdAt,
      replies: f.replies.map((r) => ({
        id: r.id,
        message: r.message,
        createdAt: r.createdAt,
        admin: r.admin,
        // expose a boolean 'read' not the recipient DB id
        read: r.recipients[0]?.read ?? false,
      })),
    }));

    return NextResponse.json({ feedbacks: formattedFeedbacks });
  } catch (err) {
    console.error("Error fetching feedback replies:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}