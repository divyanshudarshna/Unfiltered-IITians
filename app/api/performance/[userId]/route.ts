import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calculatePerformance(attempts: any[]) {
  let totalScore = 0;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalTime = 0; // seconds

  // Prepare detailed attempts array
  const detailedAttempts = attempts.map((attempt) => {
    const { answers, mockTest, startedAt, submittedAt, score } = attempt;
    const questions = mockTest?.questions ?? [];

    let correctCount = 0;
    let incorrectCount = 0;

    if (questions.length > 0 && answers && typeof answers === "object") {
      questions.forEach((q, i) => {
        const userAnswer = answers[i.toString()];
        const correctAnswer = q.correctAnswer ?? q.answer;
        const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        if (isCorrect) correctCount++;
        else incorrectCount++;
      });
      totalQuestions += questions.length;
      totalCorrect += correctCount;
      totalIncorrect += incorrectCount;
    }

    if (startedAt && submittedAt) {
      totalTime += (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000;
    }

    if (typeof score === "number") totalScore += score;

    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const estimatedRank = Math.max(1, Math.floor(100 - percentage)); // example rank logic

    return {
      id: attempt.id,
      mockTestId: mockTest?.id ?? "",
      mockTestTitle: mockTest?.title ?? "",
      score: score ?? correctCount,
      totalQuestions: questions.length,
      percentage,
      timeTaken: startedAt && submittedAt
        ? (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000
        : 0,
      estimatedRank,
      correctCount,
      incorrectCount,
    };
  });

  const avgScore = attempts.length ? Math.round(totalScore / attempts.length) : 0;
  const estimatedRankOverall = Math.max(1, Math.floor(1000 - avgScore * 10));

  return {
    avgScore,
    totalAttempts: attempts.length,
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    totalTime: Math.round(totalTime),
    estimatedRank: estimatedRankOverall,
    detailedAttempts,
  };
}

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;

    // Fetch user attempts including related mockTest data
    const attempts = await prisma.mockAttempt.findMany({
      where: { userId },
      include: {
        mockTest: true,
      },
      orderBy: { startedAt: "desc" },
    });

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ message: "No attempts found", data: null }, { status: 200 });
    }

    const performance = calculatePerformanceDetails(attempts);

    return NextResponse.json({ attempts, performance });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
