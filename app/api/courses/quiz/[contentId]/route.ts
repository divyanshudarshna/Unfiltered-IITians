import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { hasFullContentAccess } from "@/lib/courseAccess";

export async function GET(
  req: Request,
  context: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await context.params;
    const { userId } = await auth();
    const access = await hasFullContentAccess(contentId, userId);
    if (!access) {
      return NextResponse.json({ error: "Course content not found" }, { status: 404 });
    }
    if (!access.entitlement.hasFullAccess) {
      return NextResponse.json({ error: "Course enrollment required" }, { status: 403 });
    }

    const quiz = await prisma.quiz.findFirst({
      where: { contentId },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found for this content" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: quiz.id,
      contentId: quiz.contentId,
      questions: quiz.questions,
    });
  } catch (error) {
    console.error("Quiz fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}
