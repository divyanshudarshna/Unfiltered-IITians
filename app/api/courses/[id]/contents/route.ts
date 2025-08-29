// app/api/courses/[id]/contents/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";  // ✅ use getAuth instead of auth
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { userId: clerkUserId } = getAuth(req); // ✅ pass req
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Map Clerk user → DB user
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // (Optional) ensure enrolled or staff
    // const isEnrolled = await prisma.enrollment.findFirst({
    //   where: { userId: user.id, courseId: params.id }
    // });
    // if (!isEnrolled) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

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
      contents: course.contents.map((c) => ({
        id: c.id,
        title: c.title,
        order: c.order,
        lectures: c.lectures.map((l) => ({
          id: l.id,
          title: l.title,
          summary: l.summary ?? "",
          videoUrl: l.videoUrl ?? "",
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
