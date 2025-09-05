// app/api/courses/enrollments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // 🔑 Clerk auth
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔑 Resolve DB user
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Fetch enrollments with course + contents + user’s course progress
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: dbUser.id },
      include: {
        course: {
          include: {
            contents: {
              include: {
                lectures: true,
                quiz: true,
              },
              orderBy: { order: "asc" },
            },
            courseProgress: {
              where: { userId: dbUser.id },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // ✅ Shape response (calculate progress exactly like inside course page)
    const result = enrollments.map((enroll) => {
      let completed = 0;
      let total = 0;

      enroll.course.contents.forEach((content) => {
        // Count lectures
        content.lectures.forEach((lecture) => {
          total++;
          const lectureCompleted = enroll.course.courseProgress?.some(
            (cp) => cp.contentId === content.id && cp.completed
          );
          if (lectureCompleted) completed++;
        });

        // Count quiz
        if (content.quiz) {
          total++;
          const quizCompleted = enroll.course.courseProgress?.some(
            (cp) => cp.contentId === content.id && cp.completed
          );
          if (quizCompleted) completed++;
        }
      });

      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      // ✅ Valid till calculation
      const validTillDate = new Date(enroll.enrolledAt);
      validTillDate.setMonth(
        validTillDate.getMonth() + (enroll.course.durationMonths || 0)
      );

      return {
        id: enroll.course.id,
        title: enroll.course.title,
        description: enroll.course.description,
        price: enroll.course.price,
        actualPrice: enroll.course.actualPrice,
        status: enroll.course.status,
        enrolledAt: enroll.enrolledAt,
        progress,
        totalContents: total,
        completedContents: completed,
        validTill: validTillDate.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Get enrolled courses error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
