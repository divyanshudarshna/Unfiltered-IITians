// app/api/courses/[id]/contents/route.ts
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Map Clerk user → DB user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, role: true }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is admin (from database role)
    const isAdminFromDB = user.role === 'ADMIN';
    
    // Check if user is admin (from Clerk metadata)
    let isAdminFromClerk = false;
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(clerkUserId)
      isAdminFromClerk = clerkUser.publicMetadata?.role === 'ADMIN';
    } catch {
      console.log('⚠️ [CONTENTS] Could not fetch Clerk user data, continuing with DB role check')
    }

    const isAdmin = isAdminFromDB || isAdminFromClerk;

    // Skip enrollment/subscription checks for admins
    let enrollment = null;
    let subscription = null;

    if (!isAdmin) {
      // Check if user is enrolled in the course
      enrollment = await prisma.enrollment.findFirst({
        where: { 
          userId: user.id, 
          courseId: params.id 
        }
      });

      if (!enrollment) {
        return NextResponse.json({ 
          error: "Access denied. You are not enrolled in this course.",
          redirectTo: "/courses",
          code: "NOT_ENROLLED"
        }, { status: 403 });
      }

      // Check if enrollment has expired
      if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
        return NextResponse.json({ 
          error: "Your course access has expired.",
          redirectTo: "/courses",
          code: "EXPIRED"
        }, { status: 403 });
      }

      // Check if user has an active subscription for the course
      subscription = await prisma.subscription.findFirst({
        where: { 
          userId: user.id, 
          courseId: params.id,
          paid: true
        }
      });

      if (subscription && subscription.expiresAt && subscription.expiresAt < new Date()) {
        return NextResponse.json({ 
          error: "Your course subscription has expired.",
          redirectTo: "/courses",
          code: "SUBSCRIPTION_EXPIRED"
        }, { status: 403 });
      }
    } else {
      console.log(`✅ [CONTENTS] Admin access granted for course ${params.id}`)
    }

    // Fetch course with contents + lectures + quiz
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        contents: {
          orderBy: { order: "asc" },
          include: {
            lectures: { orderBy: { order: "asc" } },
            quiz: { select: { id: true } },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Shape response
    const shaped = {
      id: course.id,
      title: course.title,
      description: course.description,
      isAdmin,
      enrollmentExpiresAt: enrollment?.expiresAt || null,
      subscriptionExpiresAt: subscription?.expiresAt || null,
      contents: course.contents.map((c) => ({
        id: c.id,
        title: c.title,
        order: c.order,
        lectures: c.lectures.map((l) => ({
          id: l.id,
          title: l.title,
          summary: l.summary ?? "",
          videoUrl: l.videoUrl ?? "",
          youtubeEmbedUrl: l.youtubeEmbedUrl ?? "",
          pdfUrl: l.pdfUrl ?? "",
          order: l.order,
        })),
        hasQuiz: !!c.quiz,
        quizId: c.quiz?.id ?? null,
      })),
    };

    return NextResponse.json(shaped);
  } catch (e) {
    console.error("❌ Error fetching course contents:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
