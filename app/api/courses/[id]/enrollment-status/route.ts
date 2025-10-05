// app/api/courses/[id]/enrollment-status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server"; // ✅ App Router way

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    // 🔑 Get current Clerk user
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const clerkUserId = user.id;

    const { id: courseId } = params;

    // Validate courseId length
    if (!courseId || courseId.length !== 24) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    // 🔑 Find DB user by clerkUserId
    const dbUser = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    // ✅ Find course
    const course = await prisma.course.findFirst({
      where: { id: courseId, status: "PUBLISHED" },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found or not available" }, { status: 404 });
    }

    // ✅ Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: dbUser.id, courseId },
      include: {
        course: {
          include: {
            contents: {
              include: { lectures: true, quiz: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({
        isEnrolled: false,
        canEnroll: true,
        course: {
          id: course.id,
          title: course.title,
          price: course.price,
          requiresPayment: course.price > 0,
        },
      });
    }

    // Check if enrollment has expired
    const isExpired = enrollment.expiresAt && enrollment.expiresAt < new Date();
    
    // Check subscription status
    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: dbUser.id, 
        courseId,
        paid: true
      }
    });
    
    const isSubscriptionExpired = subscription?.expiresAt && subscription.expiresAt < new Date();

    // ✅ Compute progress safely
    const totalContents = enrollment?.course?.contents?.length ?? 0;
    const completedContents = 0; // TODO: implement actual tracking
    const progress = totalContents > 0 ? Math.floor((completedContents / totalContents) * 100) : 0;

    return NextResponse.json({
      isEnrolled: true,
      enrolledAt: enrollment.enrolledAt,
      enrollmentExpiresAt: enrollment.expiresAt,
      subscriptionExpiresAt: subscription?.expiresAt,
      isExpired,
      isSubscriptionExpired,
      progress,
      totalContents,
      completedContents,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
      },
    });
  } catch (err) {
    console.error("❌ Enrollment status error:", err);
    return NextResponse.json({ error: "Failed to check enrollment status" }, { status: 500 });
  }
}
