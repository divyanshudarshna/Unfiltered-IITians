import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ResultClient from "./ResultClient";
import { getParams, getSearchParams } from "@/lib/nextParams";

interface Params {
  id: string;
  attemptId: string;
}
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export default async function MockResultPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  // ✅ cleaner, using helpers
  const { attemptId } = await getParams(params);
  const resolvedSearchParams = await getSearchParams(searchParams);

  const qParam = Array.isArray(resolvedSearchParams?.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams?.q;

  const attempt = await prisma.mockAttempt.findUnique({
    where: { id: attemptId },
    include: { mockTest: true },
  });

  if (!attempt) {
    console.error("Attempt not found", attemptId);
    redirect("/mocks");
  }

  // Debug logging
  console.log("Result Page Debug:", {
    attemptId: attempt.id,
    answersType: typeof attempt.answers,
    answersContent: attempt.answers,
    storedStats: {
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      score: attempt.score
    }
  });

  const attemptCount = await prisma.mockAttempt.count({
    where: { userId: attempt.userId, mockTestId: attempt.mockTestId },
  });

  console.log("Rendering attempt:", attempt.id, "for user:", attempt.userId);
  return (
    <ResultClient
      attempt={attempt}
      attemptCount={attemptCount}
      initialQuestion={qParam ? parseInt(qParam) - 1 : 0}
    />
  );
}
