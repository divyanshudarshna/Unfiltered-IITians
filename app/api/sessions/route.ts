import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = getAuth(req);

    let enrolledSessionIds: string[] = [];

    if (clerkId) {
      // ✅ Find user by clerkUserId
      const user = await prisma.user.findUnique({
        where: { clerkUserId: clerkId },
      });

      if (user) {
        // ✅ Fetch successful enrollments for this user
        const enrollments = await prisma.sessionEnrollment.findMany({
          where: {
            userId: user.id,
            paymentStatus: PaymentStatus.SUCCESS, // ✅ must match enum in schema
          },
          select: { sessionId: true },
        });

        enrolledSessionIds = enrollments.map((e) => e.sessionId.toString());
      }
    }

    // ✅ Fetch all sessions
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
    });

    // ✅ Attach isEnrolled flag
    const sessionsWithEnrollment = sessions.map((s) => {
      const sessionIdStr = s.id.toString();
      return {
        id: sessionIdStr,
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
        isEnrolled: enrolledSessionIds.includes(sessionIdStr),
      };
    });

    return NextResponse.json(
      { sessions: sessionsWithEnrollment },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions", details: error.message },
      { status: 500 }
    );
  }
}
