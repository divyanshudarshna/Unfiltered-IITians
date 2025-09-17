"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  BookOpenCheck,
  ListChecks,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type Question = {
  id: string;
  question: string;
  type: "MCQ" | "MSQ" | "NAT" | "True/False" | "Short Answer";
  options?: string[];
  answer: string;
  explanation?: string;
};

function normalizeAnswer(q: Question): string[] {
  if (!q.answer) return [];
  if (q.type === "MSQ") {
    return q.answer.split(";").map((letter) => {
      const idx = letter.charCodeAt(0) - 65;
      return q.options?.[idx] ?? letter;
    });
  }
  if (q.type === "MCQ") {
    const idx = q.answer.charCodeAt(0) - 65;
    return [q.options?.[idx] ?? q.answer];
  }
  return [q.answer];
}

function isCorrect(q: Question, userAns?: string): boolean {
  if (!userAns) return false;
  const correct = normalizeAnswer(q);

  if (q.type === "MSQ") {
    const userArr = userAns.split(";").map((a) => a.trim());
    return (
      userArr.length === correct.length &&
      userArr.every((a) => correct.includes(a))
    );
  }

  return correct.includes(userAns);
}

export default function ResultClient({
  attempt,
  attemptCount,
}: {
  attempt: any;
  attemptCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // derive current question index from URL
  const qParam = parseInt(searchParams.get("q") ?? "1", 10);
  const currentQuestionIndex = Math.max(0, qParam - 1);

  const questions = attempt.mockTest.questions as Question[];
  const answers = attempt.answers as Record<string, string>;

  // Stats
  const totalQuestions = questions.length;
  const correctCount = questions.filter((q) =>
    isCorrect(q, answers[q.id])
  ).length;
  const attemptedCount = Object.keys(answers).length;
  const incorrectCount = attemptedCount - correctCount;
  const unansweredCount = totalQuestions - attemptedCount;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

  const startedAt = new Date(attempt.startedAt);
  const submittedAt = new Date(attempt.submittedAt ?? Date.now());
  const timeTaken = Math.floor(
    (submittedAt.getTime() - startedAt.getTime()) / 1000
  );
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  const currentQuestion = questions[currentQuestionIndex];

  // Navigation
  const goToQuestion = (idx: number) => {
    router.replace(`?q=${idx + 1}`);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) goToQuestion(currentQuestionIndex - 1);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1)
      goToQuestion(currentQuestionIndex + 1);
  };

  const handleReviewIncorrect = () => {
    const firstIncorrectIndex = questions.findIndex(
      (q) => !isCorrect(q, answers[q.id])
    );
    if (firstIncorrectIndex !== -1) goToQuestion(firstIncorrectIndex);
  };

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
      {/* Left Content */}
      <div className="flex-1 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push(`/mocks/${attempt.mockTest.id}/attempts`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Attempts
        </Button>

        {/* Score Summary */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Results: {attempt.mockTest.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score / Time / Attempted */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Score
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{correctCount}</span>
                  <span className="text-muted-foreground">
                    / {totalQuestions}
                  </span>
                </div>
                <Progress value={scorePercentage} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {scorePercentage}% correct
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Time Taken
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-xl font-medium">
                    {minutes}m {seconds}s
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Attempted
                </h3>
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
            {/* Correct / Incorrect / Unanswered */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-3 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Correct</p>
                    <p className="text-lg font-semibold">
                      {correctCount} (
                      {Math.round((correctCount / totalQuestions) * 100)}%)
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                    <p className="text-lg font-semibold">
                      {incorrectCount} (
                      {Math.round((incorrectCount / totalQuestions) * 100)}%)
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Unanswered</p>
                    <p className="text-lg font-semibold">
                      {unansweredCount} (
                      {Math.round((unansweredCount / totalQuestions) * 100)}%)
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
      {currentQuestion && (
  <Card key={currentQuestion.id} className="overflow-hidden">
    <CardHeader
      className={`p-4 ${
        !answers[currentQuestion.id]
          ? "bg-gray-50 dark:bg-gray-800" // unattempted
          : isCorrect(currentQuestion, answers[currentQuestion.id])
          ? "bg-green-50 dark:bg-green-900/20" // correct
          : "bg-red-50 dark:bg-red-900/20" // incorrect
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <CardTitle className="text-lg font-medium">
          <span className="text-muted-foreground">
            Q{currentQuestionIndex + 1}:
          </span>{" "}
          {currentQuestion.question}
        </CardTitle>
        <Badge
          variant={
            !answers[currentQuestion.id]
              ? "outline"
              : isCorrect(currentQuestion, answers[currentQuestion.id])
              ? "success"
              : "destructive"
          }
          className="px-3 py-1 flex items-center gap-1"
        >
          {!answers[currentQuestion.id] ? (
            <>
              <span>Unattempted</span>
            </>
          ) : isCorrect(currentQuestion, answers[currentQuestion.id]) ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Correct</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              <span>Incorrect</span>
            </>
          )}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        Type:{" "}
        <span className="font-medium capitalize">
          {currentQuestion.type}
        </span>
      </div>
    </CardHeader>

    <CardContent className="p-4 space-y-4">
      {/* Options */}
      {(currentQuestion.type === "MCQ" || currentQuestion.type === "MSQ") &&
        currentQuestion.options && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Options
            </h4>
            <div className="grid gap-2">
              {currentQuestion.options.map((option, i) => {
                const correct = normalizeAnswer(currentQuestion).includes(option);
                const userSelected = answers[currentQuestion.id]
                  ?.split(";")
                  .includes(option);

                return (
                  <div
                    key={i}
                    className={`p-3 rounded-md border transition-colors ${
                      correct
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : userSelected && !correct
                        ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                        : "bg-muted/50 dark:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span>{option}</span>
                      {correct && (
                        <CheckCircle2 className="w-4 h-4 ml-auto text-green-600 dark:text-green-400" />
                      )}
                      {userSelected && !correct && (
                        <XCircle className="w-4 h-4 ml-auto text-red-600 dark:text-red-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Correct Answer */}
      {answers[currentQuestion.id] &&
        !isCorrect(currentQuestion, answers[currentQuestion.id]) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Correct Answer
            </h4>
            <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50 dark:bg-gray-800">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200">
                {normalizeAnswer(currentQuestion).join(", ")}
              </span>
            </div>
          </div>
        )}

      {/* Explanation */}
      {currentQuestion.explanation && (
        <Accordion type="single" collapsible>
          <AccordionItem value="explanation" className="border-0">
            <AccordionTrigger className="hover:no-underline p-0">
              <div className="flex items-center gap-2 text-primary">
                <BookOpenCheck className="h-4 w-4" />
                <span>View Explanation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-3">
              <div className="prose dark:prose-invert prose-sm bg-muted/50 p-4 rounded-md">
                {currentQuestion.explanation}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next
        </Button>
      </div>
    </CardContent>
  </Card>
)}

      </div>

      {/* Sidebar */}
      <aside className="lg:w-72 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questions</CardTitle>
          </CardHeader>
        <CardContent>
  <div className="grid grid-cols-5 gap-2">
    {questions.map((q, idx) => {
      const userAns = answers[q.id];
      const correct = isCorrect(q, userAns);

      let variant: "default" | "outline" = "outline";
      let className = "";

      if (!userAns) {
        // Unattempted
        variant = "outline";
        className =
          idx === currentQuestionIndex
            ? "ring-2 ring-primary"
            : "border-muted-foreground/30";
      } else if (correct) {
        // Correct
        variant = "default";
        className = "bg-green-600 hover:bg-green-700 text-white";
      } else {
        // Incorrect
        variant = "default";
        className = "bg-red-500 hover:bg-red-600 text-white";
      }

      return (
        <Button
          key={q.id}
          size="sm"
          variant={variant}
          className={`${className} ${
            idx === currentQuestionIndex ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => goToQuestion(idx)}
        >
          {idx + 1}
        </Button>
      );
    })}
  </div>
</CardContent>


          <Separator />

          <CardHeader>
            <CardTitle className="text-lg">Times Attempted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl text-emerald-400 font-semibold">{attemptCount}</p>
          </CardContent>

          <Separator />

          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleReviewIncorrect}
            >
              <ListChecks className="w-4 h-4" />
              Review Incorrect
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={() => router.push(`/mocks/${attempt.mockTest.id}/start`)}
            >
              <RotateCcw className="w-4 h-4" />
              Retake Mock
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push("/mocks")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Mocks
            </Button>
          </CardContent>
        </Card>
      </aside>
    </main>
  );
}
