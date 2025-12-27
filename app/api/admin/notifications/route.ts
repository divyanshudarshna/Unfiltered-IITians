import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    // Fetch pending contact messages
    const contactMessages = await prisma.contactUs.findMany({
      where: {
        status: "PENDING"
      },
      select: {
        id: true,
        name: true,
        subject: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });

    // Fetch unread feedbacks (PENDING status with no replies)
    const feedbacks = await prisma.courseFeedback.findMany({
      where: {
        status: "PENDING",
        replies: {
          none: {}
        }
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });

    // Combine and format notifications
    const notifications = [
      ...contactMessages.map(msg => ({
        id: msg.id,
        type: "contact" as const,
        title: `New contact from ${msg.name}`,
        message: msg.subject,
        createdAt: msg.createdAt,
        link: "/admin/contact-us"
      })),
      ...feedbacks.map(fb => ({
        id: fb.id,
        type: "feedback" as const,
        title: `Feedback from ${fb.user.name || fb.user.email}`,
        message: `${fb.course.title}: ${fb.content.substring(0, 50)}...`,
        createdAt: fb.createdAt,
        link: "/admin/feedbacks"
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalCount = contactMessages.length + feedbacks.length;

    return NextResponse.json({ 
      notifications,
      totalCount,
      contactCount: contactMessages.length,
      feedbackCount: feedbacks.length
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
