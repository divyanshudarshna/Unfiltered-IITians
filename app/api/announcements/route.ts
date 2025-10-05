// app/api/announcements/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        createdAt: a.createdAt,
        // expose only a boolean read (do NOT leak recipient DB id)
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
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { announcementId } = await req.json();
    if (!announcementId) return NextResponse.json({ error: "announcementId required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updated = await prisma.announcementRecipient.updateMany({
      where: { announcementId, userId: user.id },
      data: { read: true, readAt: new Date() },
    });

    // If recipient row didn't exist, create it and mark read
    // Use upsert to handle potential race conditions
    if (updated.count === 0) {
      try {
        await prisma.announcementRecipient.upsert({
          where: {
            announcementId_userId: {
              announcementId,
              userId: user.id,
            },
          },
          update: {
            read: true,
            readAt: new Date(),
          },
          create: {
            announcementId,
            userId: user.id,
            read: true,
            readAt: new Date(),
            deliveredEmail: false,
          },
        });
      } catch (upsertError) {
        // If upsert fails due to concurrent creation, try update again
        console.warn("Upsert failed, retrying with update:", upsertError);
        await prisma.announcementRecipient.updateMany({
          where: { announcementId, userId: user.id },
          data: { read: true, readAt: new Date() },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error marking announcement as read:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
