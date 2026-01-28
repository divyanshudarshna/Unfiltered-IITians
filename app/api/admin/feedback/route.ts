import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess } from "@/lib/roleAuth";

export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const feedbacks = await prisma.courseFeedback.findMany({
      where: courseId ? { courseId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            profileImageUrl: true 
          } 
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        replies: {
          include: {
            admin: { select: { id: true, name: true, email: true } },
            recipients: { select: { id: true, read: true, readAt: true, userId: true } },
          },
        },
      },
    });

    return NextResponse.json({ feedbacks });
  } catch (err) {
    console.error("Error fetching admin feedback:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApiAccess(req.url, req.method);

    const { feedbackId, message } = await req.json();
    if (!feedbackId || !message)
      return NextResponse.json({ error: "feedbackId and message required" }, { status: 400 });

    const feedback = await prisma.courseFeedback.findUnique({
      where: { id: feedbackId },
      select: { userId: true },
    });
    if (!feedback) return NextResponse.json({ error: "Feedback not found" }, { status: 404 });

    const reply = await prisma.feedbackReply.create({
      data: {
        feedbackId,
        adminId: admin.id,
        message,
        recipients: {
          create: {
            userId: feedback.userId,
            read: false,
          },
        },
      },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        recipients: { select: { id: true, read: true, readAt: true, userId: true } },
      },
    });

    return NextResponse.json({ success: true, reply });
  } catch (err) {
    console.error("Error replying to feedback:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const feedbackIdOrReplyId = pathParts[pathParts.length - 1];

    if (url.pathname.includes("/reply/")) {
      // DELETE a reply
      const deleted = await prisma.feedbackReply.delete({
        where: { id: feedbackIdOrReplyId },
      });
      return NextResponse.json({ success: true, deleted });
    } else {
      // DELETE a feedback and all its replies
      const deleted = await prisma.courseFeedback.delete({
        where: { id: feedbackIdOrReplyId },
      });
      return NextResponse.json({ success: true, deleted });
    }
  } catch (err) {
    console.error("Error deleting feedback/reply:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const replyId = pathParts[pathParts.length - 1];

    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const updated = await prisma.feedbackReply.update({
      where: { id: replyId },
      data: { message },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        recipients: { select: { id: true, read: true, readAt: true, userId: true } },
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Error updating reply:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
