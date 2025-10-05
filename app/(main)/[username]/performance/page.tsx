import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PerformanceDashboardClient from "@/components/dashboard/PerformanceDashboardClient";

interface Props {
  readonly params: Promise<{ username: string }>;
}

// -------------------------
// Helper to calculate performance
// -------------------------
function calculatePerformance(attempts: any[]) {
  console.log('[calculatePerformance] Total attempts received:', attempts.length);
  
  let totalScore = 0;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalTime = 0; // seconds

  const detailedAttempts = attempts.map((attempt, attemptIndex) => {
    console.log(`[Attempt ${attemptIndex + 1}] Processing attempt ID: ${attempt.id}`);
    
    const { mockTest, startedAt, submittedAt } = attempt;
    
    // Use stored values from database instead of recalculating
    const storedCorrectCount = attempt.correctCount || 0;
    const storedIncorrectCount = attempt.incorrectCount || 0;
    const storedTotalQuestions = attempt.totalQuestions || 0;
    const storedScore = attempt.score || 0;
    const storedPercentage = attempt.percentage || 0;
    
    console.log(`[Attempt ${attemptIndex + 1}] Stored values:`, {
      correctCount: storedCorrectCount,
      incorrectCount: storedIncorrectCount,
      totalQuestions: storedTotalQuestions,
      score: storedScore,
      percentage: storedPercentage
    });

    // Calculate time taken
    let timeTaken = 0;
    if (startedAt && submittedAt) {
      timeTaken = (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000;
    }

    // Use stored values for aggregation
    totalScore += storedScore;
    totalQuestions += storedTotalQuestions;
    totalCorrect += storedCorrectCount;
    totalIncorrect += storedIncorrectCount;
    totalTime += timeTaken;

    return {
      id: attempt.id,
      mockTestId: mockTest?.id ?? "",
      mockTestTitle: mockTest?.title ?? "Unknown",
      score: storedScore,
      totalQuestions: storedTotalQuestions,
      percentage: storedPercentage,
      timeTaken,
      estimatedRank: Math.max(1, 100 - storedPercentage),
      correctCount: storedCorrectCount,
      incorrectCount: storedIncorrectCount,
    };
  });

  const avgScore = attempts.length ? Math.round(totalScore / attempts.length) : 0;
  const avgPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const estimatedRank = Math.max(1, Math.floor(1000 - avgPercentage * 10));

  const result = {
    avgScore,
    totalAttempts: attempts.length,
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    totalTime: Math.round(totalTime),
    estimatedRank,
    detailedAttempts,
  };

  console.log('[calculatePerformance] Final result:', result);
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
        where: {
          submittedAt: { not: null } // Only include submitted attempts
        },
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

  return (
    <PerformanceDashboardClient
      performance={performance}
    />
  );
}
