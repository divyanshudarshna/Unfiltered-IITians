import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PerformanceDashboardClient from "@/components/dashboard/PerformanceDashboardClient";

interface Props {
  params: { username: string };
}

// Helper to calculate summary and detailed attempts
function calculatePerformance(attempts: any[]) {
  let totalScore = 0;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalTime = 0; // seconds

  // Detailed attempts array
  const detailedAttempts = attempts.map((attempt) => {
    const { answers = {}, mockTest, startedAt, submittedAt, score } = attempt;
    const questions = mockTest?.questions ?? [];
    const totalQs = questions.length;

    let correctCount = 0;

    questions.forEach((q, i) => {
      const userAnswer = answers[i.toString()];
      const correctAnswer = q.correctAnswer ?? q.answer;
      if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
        correctCount++;
      }
    });

    const incorrectCount = totalQs - correctCount;
    const percentage = totalQs > 0 ? Math.round((correctCount / totalQs) * 100) : 0;

    let timeTaken = 0;
    if (startedAt && submittedAt) {
      timeTaken = (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000;
    }

    // Aggregate for summary stats
    totalScore += score ?? correctCount;
    totalQuestions += totalQs;
    totalCorrect += correctCount;
    totalIncorrect += incorrectCount;
    totalTime += timeTaken;

    return {
      id: attempt.id,
      mockTestId: mockTest?.id ?? "",
      mockTestTitle: mockTest?.title ?? "Unknown",
      score: score ?? correctCount,
      totalQuestions: totalQs,
      percentage,
      timeTaken,
      estimatedRank: Math.max(1, 100 - percentage), // Example rank calc
      correctCount,
      incorrectCount,
    };
  });

  const avgScore = attempts.length ? Math.round(totalScore / attempts.length) : 0;
  const estimatedRank = Math.max(1, Math.floor(1000 - avgScore * 10));

  return {
    avgScore,
    totalAttempts: attempts.length,
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    totalTime: Math.round(totalTime),
    estimatedRank,
    detailedAttempts,
  };
}

export default async function PerformanceDashboard({ params }: Props) {
  const user = await currentUser();
  const decodedUsername = decodeURIComponent(params.username);

  if (!user || user.firstName !== decodedUsername) {
    redirect("/unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
    include: {
      mockAttempts: {
        include: { mockTest: true },
        orderBy: { submittedAt: "desc" },
      },
      subscriptions: { include: { mockTest: true } },
    },
  });

  if (!dbUser) redirect("/unauthorized");

  const performance = calculatePerformance(dbUser.mockAttempts);

  const safeUser = {
    id: user.id,
    fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    email: user.emailAddresses[0]?.emailAddress ?? "",
    username: user.username ?? "",
    phoneNumber: user.phoneNumbers?.[0]?.phoneNumber ?? "",
    imageUrl: user.imageUrl ?? "",
    createdAt: user.createdAt,
  };

  return (
    <PerformanceDashboardClient
      safeUser={safeUser}
      attempts={dbUser.mockAttempts}
      performance={performance}
      subscriptions={dbUser.subscriptions}
    />
  );
}
