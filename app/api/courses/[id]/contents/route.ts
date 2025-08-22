// app/api/courses/[id]/contents/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface Params { params: { id: string } }

export async function GET(req: Request, { params }: Params) {
  try {
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Map Clerk user → DB user
    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Ensure the user is enrolled (or is ADMIN/INSTRUCTOR)
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const isStaff = dbUser?.role === "ADMIN" || dbUser?.role === "INSTRUCTOR";

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: user.id, courseId: params.id },
    });

    if (!isStaff && !enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        contents: {
          orderBy: { order: "asc" }, // assuming you added an `order` field
          include: {
            lectures: { orderBy: { order: "asc" } },
            quiz: true,
          },
        },
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Optionally strip sensitive URLs or fields if needed
    return NextResponse.json(course);
  } catch (e) {
    console.error("Error fetching course contents:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
