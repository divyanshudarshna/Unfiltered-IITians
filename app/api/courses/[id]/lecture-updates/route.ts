import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCourseEntitlement } from "@/lib/courseAccess";

interface Params {
  params: Promise<{ id: string }>;
}

async function getAuthorizedUser(courseId: string) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const entitlement = await getCourseEntitlement(clerkUserId, courseId);
  if (!entitlement.hasFullAccess || !entitlement.userId) {
    return { error: NextResponse.json({ error: "Active course access required" }, { status: 403 }) };
  }

  return { userId: entitlement.userId };
}

// GET establishes a per-user baseline on first course visit. Later lecture additions
// are returned until the user explicitly opens the notification bell.
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id: courseId } = await params;
    const authorized = await getAuthorizedUser(courseId);
    if ("error" in authorized) return authorized.error;

    const existingCursor = await prisma.courseLectureUpdateCursor.findUnique({
      where: { userId_courseId: { userId: authorized.userId, courseId } },
      select: { lastSeenAt: true },
    });
    const seenThrough = new Date();

    if (!existingCursor) {
      await prisma.courseLectureUpdateCursor.upsert({
        where: { userId_courseId: { userId: authorized.userId, courseId } },
        update: {},
        create: { userId: authorized.userId, courseId, lastSeenAt: seenThrough },
      });
      return NextResponse.json({ updates: [], seenThrough: seenThrough.toISOString() });
    }

    const lectures = await prisma.lecture.findMany({
      where: {
        content: { courseId },
        createdAt: { gt: existingCursor.lastSeenAt },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        content: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      updates: lectures.map((lecture) => ({
        id: lecture.id,
        title: lecture.title,
        contentTitle: lecture.content.title,
        createdAt: lecture.createdAt?.toISOString() ?? null,
      })),
      seenThrough: seenThrough.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching course lecture updates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH advances only to the snapshot returned by GET so a lecture created while
// the bell is open remains unread on the next fetch.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id: courseId } = await params;
    const authorized = await getAuthorizedUser(courseId);
    if ("error" in authorized) return authorized.error;

    const { seenThrough } = await request.json();
    const date = new Date(seenThrough);
    if (!seenThrough || Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 60_000) {
      return NextResponse.json({ error: "A valid notification snapshot is required" }, { status: 400 });
    }

    const existingCursor = await prisma.courseLectureUpdateCursor.findUnique({
      where: { userId_courseId: { userId: authorized.userId, courseId } },
      select: { lastSeenAt: true },
    });
    const lastSeenAt = existingCursor && existingCursor.lastSeenAt > date ? existingCursor.lastSeenAt : date;

    await prisma.courseLectureUpdateCursor.upsert({
      where: { userId_courseId: { userId: authorized.userId, courseId } },
      update: { lastSeenAt },
      create: { userId: authorized.userId, courseId, lastSeenAt },
    });

    return NextResponse.json({ success: true, lastSeenAt: lastSeenAt.toISOString() });
  } catch (error) {
    console.error("Error marking course lecture updates as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
