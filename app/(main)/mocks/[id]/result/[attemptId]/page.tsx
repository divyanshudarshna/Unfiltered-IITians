// app/mocks/[id]/results/[attemptId]/page.tsx

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, CheckCircle2, XCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MockResultPage({
  params,
  searchParams,
}: {
  params: { id: string; attemptId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const attempt = await prisma.mockAttempt.findUnique({
    where: { id: params.attemptId },
    include: { mockTest: true },
  });

  if (!attempt) {
    return <p className="p-6 text-red-500">Attempt not found</p>;
  }

  // ✅ Count how many times this user has attempted this test
const attemptCount = await prisma.mockAttempt.count({
  where: {
    userId: attempt.userId,
    mockTestId: attempt.mockTestId,
  },
});

  const questions = attempt.mockTest.questions as Array<{
    id: string;
    question: string;
    type: 'MCQ' | 'MSQ' | 'True/False' | 'Short Answer';
    options?: string[];
    answer: string;
    explanation?: string;
  }>;

  const answers = attempt.answers as Record<string, string>;
  const totalQuestions = questions.length;
  const correctCount = questions.filter((q) => answers[q.id] === q.answer).length;
  const attemptedCount = Object.keys(answers).length;
  const incorrectCount = attemptedCount - correctCount;
  const unansweredCount = totalQuestions - attemptedCount;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

  const startedAt = new Date(attempt.startedAt);
  const submittedAt = new Date(attempt.submittedAt ?? Date.now());
  const timeTaken = Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000);
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  // Get current question index from search params or default to first question
  const currentQuestionIndex = searchParams.q 
    ? Math.min(Math.max(parseInt(searchParams.q as string) - 1, 0), questions.length - 1)
    : 0;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
      {/* Left Content - Main Question View */}
      <div className="flex-1 space-y-6">
        {/* Score Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Results: {attempt.mockTest.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Score</h3>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{correctCount}</span>
                  <span className="text-muted-foreground">/ {totalQuestions}</span>
                </div>
                <Progress value={scorePercentage} className="h-2" />
                <p className="text-sm text-muted-foreground">{scorePercentage}% correct</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Time Taken</h3>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-medium">
                    {minutes}m {seconds}s
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Attempted</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-medium">
                    {attemptedCount} of {totalQuestions}
                  </span>
                  <span className="text-muted-foreground">
                    ({Math.round((attemptedCount / totalQuestions) * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Correct</p>
                  <p className="text-lg font-semibold">
                    {correctCount} <span className="text-sm text-muted-foreground">({Math.round((correctCount / totalQuestions) * 100)}%)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                  <p className="text-lg font-semibold">
                    {incorrectCount} <span className="text-sm text-muted-foreground">({Math.round((incorrectCount / totalQuestions) * 100)}%)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Unanswered</p>
                  <p className="text-lg font-semibold">
                    {unansweredCount} <span className="text-sm text-muted-foreground">({Math.round((unansweredCount / totalQuestions) * 100)}%)</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Question View */}
        {currentQuestion && (
          <QuestionReviewCard 
            question={currentQuestion} 
            index={currentQuestionIndex}
            userAnswer={answers[currentQuestion.id]}
            totalQuestions={totalQuestions}
          />
        )}

        {/* Question Navigation Controls */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
          <div className="flex gap-2">
            <Button 
              asChild
              variant="outline" 
              size="sm" 
              disabled={currentQuestionIndex === 0}
            >
              <Link href={`?q=${currentQuestionIndex}`}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
              size="sm"
              disabled={currentQuestionIndex === totalQuestions - 1}
            >
              <Link href={`?q=${currentQuestionIndex + 2}`}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="lg:w-72 space-y-6">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg">Questions Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.answer;
                const isAnswered = userAnswer !== undefined && userAnswer !== null;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <Button
                    key={q.id}
                    asChild
                    size="sm"
                    variant={isCurrent ? "outline" : "secondary"}
                    className={`h-10 w-full rounded-md flex-col gap-0.5 ${
                      !isAnswered
                        ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        : isCorrect
                          ? "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40 border-green-300 dark:border-green-700"
                          : "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40 border-red-300 dark:border-red-700"
                    }`}
                  >
                    <Link href={`?q=${idx + 1}`}>
                      <span className="font-medium">{idx + 1}</span>
                      <span className={`text-xs ${
                        !isAnswered 
                          ? "text-gray-500 dark:text-gray-400" 
                          : isCorrect 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                      }`}>
                        {!isAnswered ? '—' : isCorrect ? '✓' : '✗'}
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Correct Answers</span>
                <span className="font-medium">{correctCount} ({Math.round((correctCount / totalQuestions) * 100)}%)</span>
              </div>
              <Progress value={(correctCount / totalQuestions) * 100} className="h-2 bg-green-100 dark:bg-green-900/30" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Incorrect Answers</span>
                <span className="font-medium">{incorrectCount} ({Math.round((incorrectCount / totalQuestions) * 100)}%)</span>
              </div>
              <Progress value={(incorrectCount / totalQuestions) * 100} className="h-2 bg-red-100 dark:bg-red-900/30"  />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unanswered</span>
                <span className="font-medium">{unansweredCount} ({Math.round((unansweredCount / totalQuestions) * 100)}%)</span>
              </div>
              <Progress value={(unansweredCount / totalQuestions) * 100} className="h-2 bg-gray-100 dark:bg-gray-800"  />
            </div>

            {/* 🆕 Show attempt count */}
<div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
  <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
  <div>
    <p className="text-sm text-muted-foreground">Times Attempted</p>
    <p className="text-lg font-semibold">{attemptCount}</p>
  </div>
</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="default" className="w-full">
              <Link href={`?q=${questions.findIndex(q => answers[q.id] !== q.answer) + 1}`}>
                Review Incorrect Answers
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/mocks/${params.id}/start`}>Retake This Test</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/mocks">Back to All Tests</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </main>
  );
}

function QuestionReviewCard({
  question,
  index,
  userAnswer,
  totalQuestions
}: {
  question: {
    id: string;
    question: string;
    type: 'MCQ' | 'MSQ' | 'True/False' | 'Short Answer';
    options?: string[];
    answer: string;
    explanation?: string;
  };
  index: number;
  userAnswer?: string;
  totalQuestions: number;
}) {
  const isCorrect = userAnswer === question.answer;
  const isAnswered = userAnswer !== undefined && userAnswer !== null;

  return (
    <Card key={question.id} className="overflow-hidden">
      <CardHeader className={`p-4 ${isCorrect ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg font-medium">
            <span className="text-muted-foreground">Q{index + 1}:</span> {question.question}
          </CardTitle>
          <Badge variant={isCorrect ? "success" : "destructive"} className="px-3 py-1">
            {isCorrect ? "Correct" : "Incorrect"}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Type: <span className="font-medium capitalize">{question.type}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Display options for MCQ/MSQ questions */}
        {(question.type === 'MCQ' || question.type === 'MSQ') && question.options && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Options</h4>
            <div className="grid gap-2">
              {question.options.map((option, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-md border ${
                    option === question.answer
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                      : option === userAnswer && !isCorrect
                        ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                        : "bg-muted/50 dark:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{String.fromCharCode(65 + i)}.</span>
                    <span>{option}</span>
                    {option === question.answer && (
                      <CheckCircle2 className="w-4 h-4 ml-auto text-green-600 dark:text-green-400" />
                    )}
                    {option === userAnswer && !isCorrect && (
                      <XCircle className="w-4 h-4 ml-auto text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Your Answer</h4>
          <div className={`flex items-center gap-2 p-3 rounded-md ${isCorrect ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"}`}>
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <span className={isCorrect ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
              {isAnswered ? userAnswer : "Not answered"}
            </span>
          </div>
        </div>

        {!isCorrect && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Correct Answer</h4>
            <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 dark:bg-gray-800">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200">{question.answer}</span>
            </div>
          </div>
        )}

        {question.explanation && (
          <Accordion type="single" collapsible>
            <AccordionItem value="explanation" className="border-0">
              <AccordionTrigger className="hover:no-underline p-0">
                <div className="flex items-center gap-2 text-primary">
                  <span>View Explanation</span>
                  <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0 pt-3">
                <div className="prose dark:prose-invert prose-sm bg-muted/50 p-4 rounded-md">
                  {question.explanation}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}