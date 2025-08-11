import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MockResultPage({
  params,
}: {
  params: { id: string; attemptId: string };
}) {
  // Fetch attempt + mock test
  const attempt = await prisma.mockAttempt.findUnique({
    where: { id: params.attemptId },
    include: { mockTest: true },
  });

  if (!attempt) {
    return <p className="p-6 text-red-500">Attempt not found</p>;
  }

  const questions = attempt.mockTest.questions as any[];
  const answers = attempt.answers as Record<number, string>;

  const totalQuestions = questions.length;
  const score = attempt.score ?? 0;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Score Summary */}
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Test Result: {attempt.mockTest.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            You scored{" "}
            <span className="font-bold text-green-600">{score}</span> out of{" "}
            <span className="font-bold">{totalQuestions}</span>
          </p>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const userAnswer = answers[idx];
          const isCorrect = userAnswer === q.correctAnswer;

          return (
            <Card
              key={idx}
              className={`border-l-4 ${
                isCorrect ? "border-green-500" : "border-red-500"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-base">
                  Q{idx + 1}: {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Your Answer:</strong>{" "}
                  <span
                    className={
                      isCorrect ? "text-green-600" : "text-red-600 font-medium"
                    }
                  >
                    {userAnswer || "Not answered"}
                  </span>
                </p>
                {!isCorrect && (
                  <p>
                    <strong>Correct Answer:</strong>{" "}
                    <span className="text-green-600">{q.correctAnswer}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
