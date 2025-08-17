import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PerformanceDashboardClient from "@/components/dashboard/PerformanceDashboardClient";

interface Props {
  params: { username: string };
}

// -------------------------
// Helper to calculate performance
// -------------------------
function calculatePerformance(attempts: any[]) {
  // console.log('[calculatePerformance] Total attempts received:', attempts.length);
  
  let totalScore = 0;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalTime = 0; // seconds

  const detailedAttempts = attempts.map((attempt, attemptIndex) => {
    
    
    const { answers = {}, mockTest, startedAt, submittedAt } = attempt;
    const questions = mockTest?.questions ?? [];
    const totalQs = questions.length;


    let correctCount = 0;
    let questionDebug = [];

    questions.forEach((q, i) => {
      const questionId = q.id || `q-${i}`;
      const userAnswer = answers[questionId];
      const correctAnswer = q.correctAnswer ?? q.answer;

      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
      if (isCorrect) correctCount++;

      questionDebug.push({
        questionIndex: i,
        questionId,
        userAnswer,
        correctAnswer,
        isCorrect,
        comparison: `User: ${JSON.stringify(userAnswer)} | Correct: ${JSON.stringify(correctAnswer)}`
      });
    });

    

    const incorrectCount = totalQs - correctCount;
    const percentage = totalQs > 0 ? Math.round((correctCount / totalQs) * 100) : 0;

    let timeTaken = 0;
    if (startedAt && submittedAt) {
      timeTaken = (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000;
    }

    // ✅ Always treat score = correctCount
    const score = correctCount;

    // Aggregate
    totalScore += score;
    totalQuestions += totalQs;
    totalCorrect += correctCount;
    totalIncorrect += incorrectCount;
    totalTime += timeTaken;

    return {
      id: attempt.id,
      mockTestId: mockTest?.id ?? "",
      mockTestTitle: mockTest?.title ?? "Unknown",
      score,              // ✅ score now equals correctCount
      totalQuestions: totalQs,
      percentage,
      timeTaken,
      estimatedRank: Math.max(1, 100 - percentage),
      correctCount,
      incorrectCount,
    };
  });

  const avgScore = attempts.length ? Math.round(totalScore / attempts.length) : 0;
  const estimatedRank = Math.max(1, Math.floor(1000 - avgScore * 10));

  const result = {
    avgScore,             // ✅ derived from correctCount
    totalAttempts: attempts.length,
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    totalTime: Math.round(totalTime),
    estimatedRank,
    detailedAttempts,
  };


  return result;
}

// -------------------------
// Main Dashboard Component
// -------------------------
export default async function PerformanceDashboard({ params }: Props) {
  const user = await currentUser();
  const awaitedParams = await params;
  const { username } = awaitedParams;
  const decodedUsername = decodeURIComponent(username);

  if (!user || user.firstName !== decodedUsername) {
    redirect("/unauthorized");
  }

  
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
    include: {
      mockAttempts: {
        include: { 
          mockTest: {
            select: {
              id: true,
              title: true,
              price: true,
              questions: true
            }
          }
        },
        orderBy: { submittedAt: "desc" },
      },
      subscriptions: { 
        include: { 
          mockTest: {
            select: {
              id: true,
              title: true,
              price: true
            }
          }
        }
      },
    },
  });

  if (!dbUser) {
   
    redirect("/unauthorized");
  }



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
