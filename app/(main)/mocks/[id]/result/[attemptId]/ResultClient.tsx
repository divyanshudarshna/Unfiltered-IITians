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
  
  // Remove any quotes and trim
  const cleanAnswer = q.answer.replace(/["']/g, '').trim();
  
  if (q.type === "MSQ") {
    return cleanAnswer.split(";")
      .map((item) => item.trim())
      .filter(item => item !== "")
      .map((item) => {
        // If it's a single letter (A, B, C, etc), convert to option text
        if (item.length === 1 && /[A-Z]/i.test(item)) {
          const idx = item.toUpperCase().charCodeAt(0) - 65;
          return q.options?.[idx] ?? item;
        }
        // Otherwise, return as is (already option text)
        return item;
      });
  }
  
  if (q.type === "MCQ") {
    // If it's a single letter (A, B, C, etc), convert to option text
    if (cleanAnswer.length === 1 && /[A-Z]/i.test(cleanAnswer)) {
      const idx = cleanAnswer.toUpperCase().charCodeAt(0) - 65;
      return [q.options?.[idx] ?? cleanAnswer];
    }
    // Otherwise, return as is
    return [cleanAnswer];
  }
  
  return [cleanAnswer];
}

function isCorrect(q: Question, userAns?: string): boolean {
  if (!userAns || userAns.trim() === "") return false;
  
  const correct = normalizeAnswer(q);
  const cleanUserAns = userAns.replace(/["']/g, '').trim();

  if (q.type === "MSQ") {
    const userArr = cleanUserAns.split(";")
      .map((a) => a.trim())
      .filter(a => a !== "")
      .sort((a, b) => a.localeCompare(b));
    const correctSorted = correct.slice().sort((a, b) => a.localeCompare(b));
    
    return (
      userArr.length === correctSorted.length &&
      userArr.every((a) => correctSorted.includes(a))
    );
  }

  if (q.type === "NAT") {
    // For numerical answers, compare as numbers
    const correctNum = parseFloat(correct[0]);
    const userNum = parseFloat(cleanUserAns);
    return !isNaN(correctNum) && !isNaN(userNum) && Math.abs(correctNum - userNum) < 0.001;
  }

  // For MCQ and other types
  return correct.includes(cleanUserAns);
}

interface ResultClientProps {
  readonly attempt: {
    id: string;
    answers: any;
    score?: number | null;
    correctCount?: number | null;
    incorrectCount?: number | null;
    unansweredCount?: number | null;
    totalQuestions?: number | null;
    percentage?: number | null;
    startedAt: string | Date;
    submittedAt?: string | Date | null;
    mockTest: {
      id: string;
      title: string;
      questions: any;
    };
  };
  readonly attemptCount: number;
  readonly initialQuestion?: number;
}

export default function ResultClient({
  attempt,
  attemptCount,
  initialQuestion = 0,
}: ResultClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse questions properly (they might be stored as JSON string)
  const rawQuestions = attempt.mockTest.questions;
  const questions = Array.isArray(rawQuestions)
    ? rawQuestions as Question[]
    : JSON.parse(rawQuestions as unknown as string) as Question[];
  
  // Parse answers properly (they might be stored as JSON)
  const rawAnswers = attempt.answers;
  let answers: Record<string, string> = {};
  
  try {
    if (typeof rawAnswers === 'object' && rawAnswers !== null) {
      // If it's already an object, use it directly
      answers = rawAnswers as Record<string, string>;
    } else if (typeof rawAnswers === 'string') {
      // If it's a string, try to parse it as JSON
      answers = JSON.parse(rawAnswers);
    } else if (Array.isArray(rawAnswers)) {
      // If it's an array (legacy format), convert to empty object
      answers = {};
    }
  } catch (error) {
    console.error("Error parsing answers:", error);
    answers = {};
  }

  // Debug logging
  console.log("ResultClient Debug:", {
    attempt: attempt.id,
    questionsCount: questions.length,
    answersCount: Object.keys(answers).length,
    storedStats: {
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage
    },
    sampleAnswers: Object.entries(answers).slice(0, 2)
  });

  // derive current question index from URL or use initialQuestion
  const qParam = parseInt(searchParams.get("q") ?? "1", 10);
  const currentQuestionIndex = Math.max(0, Math.min(qParam - 1, questions.length - 1));

  // Use stored stats from database, fallback to calculated values
  const totalQuestions = attempt.totalQuestions ?? questions.length;
  const correctCount = attempt.correctCount ?? questions.filter((q) =>
    isCorrect(q, answers[q.id])
  ).length;
  const incorrectCount = attempt.incorrectCount ?? (Object.keys(answers).length - correctCount);
  const unansweredCount = attempt.unansweredCount ?? (totalQuestions - Object.keys(answers).length);
  const scorePercentage = attempt.percentage ?? Math.round((correctCount / totalQuestions) * 100);
  const attemptedCount = Object.keys(answers).length;

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
              ? "default"
              : "destructive"
          }
          className={`px-3 py-1 flex items-center gap-1 ${
            !answers[currentQuestion.id]
              ? ""
              : isCorrect(currentQuestion, answers[currentQuestion.id])
              ? "bg-green-600 text-white"
              : ""
          }`}
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
