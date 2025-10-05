import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ isEnrolled: false });
    }

    const { id: sessionId } = await context.params;

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ isEnrolled: false });
    }

    // Check for enrollment with SUCCESS payment status only
    const enrollment = await prisma.sessionEnrollment.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: dbUser.id,
        },
      },
    });

    const isEnrolled = enrollment?.paymentStatus === "SUCCESS";

    return NextResponse.json({
      isEnrolled,
      paymentStatus: enrollment?.paymentStatus || null,
    });
  } catch (error) {
    console.error("Error checking enrollment status:", error);
    return NextResponse.json({ isEnrolled: false }, { status: 500 });
  }
}