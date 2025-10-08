// app/api/sessions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const clerkUserId = url.searchParams.get("userId"); // Clerk user ID from frontend

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
            paymentStatus: "SUCCESS" // Only show successfully paid sessions
          },
          select: { sessionId: true, completedAt: true, enrolledAt: true },
        });
        enrolledSessionIds = enrollments.map((e) => e.sessionId.toString());
      }
    }

    const sessions = await prisma.session.findMany({
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
  } catch (error: any) {
    console.error("❌ Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions", details: error.message },
      { status: 500 }
    );
  }
}
