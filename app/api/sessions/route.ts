// app/api/sessions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    let enrolledSessionIds: string[] = [];

    if (clerkUserId) {
      // Find Prisma user linked to Clerk
      const user = await prisma.user.findUnique({
        where: { clerkUserId },
      });

      if (user) {
        // Fetch sessions enrolled by the user with successful payment only
        const enrollments = await prisma.sessionEnrollment.findMany({
          where: {
            userId: user.id,
            paymentStatus: "SUCCESS",
            OR: [{ accessEndsAt: null }, { accessEndsAt: { gt: new Date() } }],
          },
          select: { sessionId: true, completedAt: true, enrolledAt: true },
        });
        enrolledSessionIds = enrollments.map((e) => e.sessionId.toString());
      }
    }

    const sessions = await prisma.session.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ],
    });

    const sessionsData = sessions.map((s) => ({
      id: s.id.toString(),
      title: s.title,
      description: s.description,
      content: s.content,
      price: s.price,
      discountedPrice: s.discountedPrice,
      maxEnrollment: s.maxEnrollment,
      type: s.type,
      duration: s.duration,
      expiryDate: s.expiryDate,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      isEnrolled: enrolledSessionIds.includes(s.id.toString()),
    }));

    return NextResponse.json({ sessions: sessionsData }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
