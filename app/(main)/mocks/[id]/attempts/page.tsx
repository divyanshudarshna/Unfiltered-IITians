import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AttemptsList from "@/components/dashboard/AttemptsList";
import { ObjectId } from "mongodb";

function computeAttemptMetrics(attempt: any) {
  const { answers = {}, mockTest, score, startedAt, submittedAt } = attempt;
  const questions = mockTest?.questions ?? [];
  const totalQuestions = questions.length;

  let correctCount = 0;
  let incorrectCount = 0;

  questions.forEach((q: any, i: number) => {
    const questionId = q.id || `q-${i}`;
    const userAnswer = answers[questionId];
    const correctAnswer = q.correctAnswer ?? q.answer;

    if (userAnswer !== undefined) {
      if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  });

  const unansweredCount = totalQuestions - (correctCount + incorrectCount);
  const percentage =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

  let timeTaken = 0;
  if (startedAt && submittedAt) {
    timeTaken =
      (new Date(submittedAt).getTime() -
        new Date(startedAt).getTime()) /
      1000;
  }

  return {
    ...attempt,
    score: correctCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions,
    percentage,
    timeTaken,
  };
}

export default async function MockAttemptsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  if (!params?.id) {
    console.error("Missing mock test ID parameter");
    redirect("/mocks");
  }

  let validMockTestId: string;
  try {
    validMockTestId = new ObjectId(params.id).toString();
  } catch (error) {
    console.error("Invalid mock test ID format:", params.id, error);
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
    orderBy: {
      submittedAt: "desc",
    },
  });

  if (!rawAttempts.length) {
    redirect("/mocks");
  }

  // 🔥 Enrich attempts with calculated metrics
  const attempts = rawAttempts.map((a) => computeAttemptMetrics(a));

  return (
    <div className="container mx-auto p-4">
      <AttemptsList
        attempts={attempts}
        mockTestTitle={attempts[0].mockTest.title}
        mockTestId={validMockTestId}
      />
    </div>
  );
}
