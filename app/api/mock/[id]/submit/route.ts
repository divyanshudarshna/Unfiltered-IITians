import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { attemptId, answers } = await req.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch attempt and related mock test
    const attempt = await prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: { mockTest: { select: { questions: true } } },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Parse questions (since stored as Json in Prisma)
    const questions = Array.isArray(attempt.mockTest.questions)
      ? attempt.mockTest.questions
      : JSON.parse(attempt.mockTest.questions as unknown as string);

    const totalQuestions = questions.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    // Calculate results
    questions.forEach((question: any) => {
       const qid = question.id; 
      const userAnswer = answers[qid];

      if (!userAnswer) {
        unansweredCount++;
      } else if (userAnswer === question.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    console.log("CorrectCount:", correctCount);
console.log("Score being saved:", correctCount);
   



    // Update attempt with all metrics
    const updatedAttempt = await prisma.mockAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score: correctCount, // ✅ now updated properly
        correctCount,
        incorrectCount,
        unansweredCount,
        totalQuestions,
        percentage,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        score: updatedAttempt.score,
        correctCount: updatedAttempt.correctCount,
        incorrectCount: updatedAttempt.incorrectCount,
        unansweredCount: updatedAttempt.unansweredCount,
        totalQuestions: updatedAttempt.totalQuestions,
        percentage: updatedAttempt.percentage,
      }
    });

  } catch (error) {
    console.error("Error submitting test:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
