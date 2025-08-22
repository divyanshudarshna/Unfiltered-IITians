// app/api/my-courses/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: true,
      },
      orderBy: { enrolledAt: "desc" },
    });

    const courses = enrollments.map(e => ({
      id: e.course.id,
      title: e.course.title,
      description: e.course.description,
      price: (e.course as any).price ?? 0,
      durationMonths: (e.course as any).durationMonths ?? 0,
      enrolledAt: e.enrolledAt,
    }));

    return NextResponse.json(courses);
  } catch (e) {
    console.error("Error fetching my courses:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
