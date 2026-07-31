// app/api/courses/[id]/contents/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCourseEntitlement } from "@/lib/courseAccess";
import { resolveCourseDeliveryMode, shapeLectureForAccess } from "@/lib/courseAccessPolicy";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();
    const previewRequested = new URL(req.url).searchParams.get("preview") === "1";
    const entitlement = await getCourseEntitlement(clerkUserId, id);

    // Fetch course with contents + lectures + quiz
    const course = await prisma.course.findUnique({
      where: { id },
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

    const hasFreePreview = course.contents.some((content) =>
      content.lectures.some((lecture) => lecture.isFreePreview),
    );
    const deliveryMode = resolveCourseDeliveryMode({
      previewRequested,
      hasFullAccess: entitlement.hasFullAccess,
      courseStatus: course.status,
      hasFreePreview,
    });
    if (deliveryMode === "DENIED") {
      return NextResponse.json({
        error: "Access denied. Enroll in this course or start its free preview.",
        redirectTo: `/courses/${id}`,
        code: "NOT_ENROLLED",
      }, { status: 403 });
    }

    // Shape response
    const shaped = {
      id: course.id,
      title: course.title,
      description: course.description,
      courseType: course.courseType,
      durationMonths: course.durationMonths,
      accessMode: deliveryMode,
      enrollmentExpiresAt: deliveryMode === "FULL" ? entitlement.enrollmentExpiresAt || null : null,
      contents: course.contents.map((c) => ({
        id: c.id,
        title: c.title,
        order: c.order,
        lectures: c.lectures.map((l) => shapeLectureForAccess({
          ...l,
          studyTips: (l.studyTips as string[] | null) ?? [],
        }, deliveryMode === "FULL")),
        hasQuiz: deliveryMode === "FULL" && !!c.quiz,
        quizId: deliveryMode === "FULL" ? c.quiz?.id ?? null : null,
        quizLocked: deliveryMode !== "FULL" && !!c.quiz,
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
