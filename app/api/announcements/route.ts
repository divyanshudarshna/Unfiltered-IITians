// app/api/announcements/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }

    // Lookup user in Prisma using clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch announcements with recipient info
    const announcements = await prisma.courseAnnouncement.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        recipients: {
          where: { userId: user.id },
          select: { read: true },
        },
      },
    });

    // Wrap response
    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        createdAt: a.createdAt,
        read: a.recipients[0]?.read ?? false,
      })),
    });
  } catch (err) {
    console.error("Error fetching announcements:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { announcementId } = await req.json();
    if (!announcementId) {
      return NextResponse.json({ error: "announcementId required" }, { status: 400 });
    }

    // Lookup user in Prisma
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Mark as read
    await prisma.announcementRecipient.updateMany({
      where: { announcementId, userId: user.id },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error marking announcement as read:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
