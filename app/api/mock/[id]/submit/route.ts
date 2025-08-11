import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { attemptId, answers } = await req.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch attempt and related mock
    const attempt = await prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: { mockTest: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Calculate score
    const questions = attempt.mockTest.questions as any[];
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });

    // Update attempt
    await prisma.mockAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, score });
  } catch (error) {
    console.error("❌ Error submitting test:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
