import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AttemptsList from "@/components/dashboard/AttemptsList";
import { ObjectId } from "mongodb";


// Compute attempt metrics using stored database values
function computeAttemptMetrics(attempt: any) {
  console.log('Computing metrics for attempt:', attempt.id);
  
  const { startedAt, submittedAt } = attempt;
  
  // Use stored values from database instead of recalculating
  const storedCorrectCount = attempt.correctCount || 0;
  const storedIncorrectCount = attempt.incorrectCount || 0;
  const storedUnansweredCount = attempt.unansweredCount || 0;
  const storedTotalQuestions = attempt.totalQuestions || 0;
  const storedScore = attempt.score || 0;
  const storedPercentage = attempt.percentage || 0;
  
  console.log('Stored values:', {
    correctCount: storedCorrectCount,
    incorrectCount: storedIncorrectCount,
    unansweredCount: storedUnansweredCount,
    totalQuestions: storedTotalQuestions,
    score: storedScore,
    percentage: storedPercentage
  });

  // Calculate time taken
  let timeTaken = 0;
  if (startedAt && submittedAt) {
    timeTaken = (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  }

  return {
    ...attempt,
    score: storedScore,
    correctCount: storedCorrectCount,
    incorrectCount: storedIncorrectCount,
    unansweredCount: storedUnansweredCount,
    totalQuestions: storedTotalQuestions,
    percentage: storedPercentage,
    timeTaken,
  };
}

export default async function MockAttemptsPage(props: { 
  readonly params: Promise<{ id: string }> 
}) {
  // ✅ Await params for Next.js 15 App Router
  const resolvedParams = await props.params;
  const mockTestIdParam = resolvedParams.id;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  if (!mockTestIdParam) {
    console.error("Missing mock test ID parameter");
    redirect("/mocks");
  }

  let validMockTestId: string;
  try {
    validMockTestId = new ObjectId(mockTestIdParam).toString();
  } catch (error) {
    console.error("Invalid mock test ID format:", mockTestIdParam, error);
    redirect("/mocks");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    console.error("User not found in database");
    redirect("/sign-in");
  }

  const rawAttempts = await prisma.mockAttempt.findMany({
    where: {
      mockTestId: validMockTestId,
      userId: dbUser.id,
      submittedAt: { not: null },
    },
    include: {
      mockTest: {
        select: {
          title: true,
          questions: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  if (!rawAttempts.length) {
    redirect("/mocks");
  }

  // Enrich attempts with metrics
  const attempts = rawAttempts.map((a) => computeAttemptMetrics(a));

  return (
    <div className="container mx-auto p-4">
     
      <AttemptsList
        attempts={attempts}
        mockTestTitle={attempts[0]?.mockTest?.title ?? "Untitled Test"}
        mockTestId={validMockTestId}
      />
    </div>
  );
}
