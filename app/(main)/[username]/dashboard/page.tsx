// app/[username]/dashboard/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";

// -------------------------
// Helper to calculate performance
// -------------------------
function calculatePerformance(attempts: any[]) {
  let totalCorrect = 0;
  let totalQuestions = 0;

  attempts.forEach((attempt) => {
    const { answers = {}, mockTest } = attempt;
    const questions = mockTest?.questions ?? [];

    let correctCount = 0;
    questions.forEach((q, i) => {
      const questionId = q.id || `q-${i}`;
      const userAnswer = answers[questionId];
      const correctAnswer = q.correctAnswer ?? q.answer;

      if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
        correctCount++;
      }
    });

    totalCorrect += correctCount;
    totalQuestions += questions.length;
  });

  // ✅ Average percentage across all attempted questions
  const avgPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    avgPercentage,
    totalAttempts: attempts.length,
    totalQuestions,
    totalCorrect,
  };
}

// -------------------------
// Main Dashboard Component
// -------------------------
interface Props {
  params: { username: string };
}

export default async function StudentDashboard({ params }: Props) {
  const user = await currentUser();
  const decodedUsername = decodeURIComponent(params.username);

  if (!user || user.firstName !== decodedUsername) {
    redirect("/unauthorized");
  }

  // Get DB user with attempts + enrollments + subscriptions
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
    include: {
      mockAttempts: {
        include: { mockTest: { select: { id: true, title: true, questions: true } } },
        orderBy: { submittedAt: "desc" },
      },
      enrollments: { include: { course: true } },
      subscriptions: true,
    },
  });

  if (!dbUser) {
    redirect("/unauthorized");
  }

  // Fetch active subscriptions separately (with mockTest details)
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: dbUser.id,
      paid: true,
    },
    include: { mockTest: true },
    orderBy: { createdAt: "desc" },
  });

  // ----- 📊 PERFORMANCE METRICS -----
  const attempts = dbUser.mockAttempts || [];
  const performance = calculatePerformance(attempts);

  const attemptedMocks = attempts.length;
  const totalMocks = await prisma.mockTest.count(); // total available mocks
  const lastAttemptDate =
    attempts.length > 0 ? attempts[0].submittedAt || null : null;

  // Safe user
  const safeUser = {
    id: user.id,
    firstName: user.firstName,
    fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`,
    email: user.emailAddresses[0]?.emailAddress ?? "",
    username: user.username ?? "",
    phoneNumber: user.phoneNumbers?.[0]?.phoneNumber ?? "",
    imageUrl: user.imageUrl ?? "",
    createdAt: user.createdAt,
  };

  console.log("avgPercentage:", performance.avgPercentage);
  console.log("attemptedMocks:", attemptedMocks);
  console.log("totalMocks:", totalMocks);
  console.log("lastAttemptDate:", lastAttemptDate);

  return (
    <DashboardClient
      safeUser={safeUser}
      initialProfile={dbUser}
      subscription={subscriptions}
      averageScore={performance.avgPercentage}   // ✅ now real average % across attempts
      attemptedMocks={attemptedMocks}
      totalMocks={totalMocks}
      lastAttemptDate={lastAttemptDate}
    />
  );
}
