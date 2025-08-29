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

    // 🔑 Resolve DB user (may or may not exist)
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
    });

    // 🔑 Decide which ID to use in Enrollment lookups
    const enrollmentUserId = dbUser ? dbUser.id : user.id;

    // ✅ Fetch enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: enrollmentUserId },
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
      orderBy: { enrolledAt: "desc" },
    });

    // ✅ Shape response
    const result = enrollments.map((e) => {
      const totalContents = e.course.contents?.length ?? 0;
      const completedContents = 0; // TODO: hook up progress tracking
      const progress =
        totalContents > 0
          ? Math.floor((completedContents / totalContents) * 100)
          : 0;

      return {
        id: e.course.id,
        title: e.course.title,
        description: e.course.description,
        price: e.course.price,
        actualPrice: e.course.actualPrice,
        status: e.course.status,
        enrolledAt: e.enrolledAt,
        progress,
        totalContents,
        completedContents,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Get enrolled courses error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
