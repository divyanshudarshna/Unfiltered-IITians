"use client";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ScientificCalculator from "./ScientificCalculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuestionNavigation from "./QuestionNavigation";
import QuestionRenderer from "./QuestionRenderer";
import HeaderStats from "./HeaderStats";
import { MockTest, AnswerState, QuestionType } from "./types";

export default function MockAttemptPage() {
  const router = useRouter();
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const [mock, setMock] = useState<MockTest | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedType, setSelectedType] = useState<"ALL" | QuestionType>("ALL");
  const { setTheme, theme } = useTheme();
  const previousTheme = useRef<string | undefined>(undefined);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!previousTheme.current) previousTheme.current = theme;
    setTheme("light");
    return () => {
      if (previousTheme.current) setTheme(previousTheme.current);
    };
  }, [theme, setTheme]);

  // Fetch mock
  useEffect(() => {
    const fetchMock = async () => {
      try {
        const res = await fetch(`/api/mock/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load mock");

        setMock(data.mock);

        setTimeLeft(
          data.mock.duration ? data.mock.duration * 60 : 60 * 60
        ); // minutes → seconds
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMock();
  }, [id]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 && mock) {
      submitAttempt();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, mock]);

  // Mark visited
  useEffect(() => {
    if (mock && mock.questions[currentIndex]) {
      setVisitedQuestions((prev) => ({
        ...prev,
        [mock.questions[currentIndex].id]: true,
      }));
    }
  }, [currentIndex, mock]);

  const toggleBookmark = () => {
    if (!mock) return;
    setBookmarked({
      ...bookmarked,
      [mock.questions[currentIndex].id]:
        !bookmarked[mock.questions[currentIndex].id],
    });
  };

  const submitAttempt = async () => {
    try {
      setLoading(true);
      if (!mock) throw new Error("Mock test data not available");

      const formattedAnswers: AnswerState = {};
      Object.entries(answers).forEach(([questionId, answerValue]) => {
        const question = mock.questions.find((q) => q.id === questionId);
        if (!question) return;

        if (question.type === "MSQ" && Array.isArray(answerValue)) {
          const normalized = answerValue
            .filter((ans) => ans && ans.trim() !== "")
            .map((ans) => ans.replace(/"/g, "").trim())
            .sort((a, b) => a.localeCompare(b));
          formattedAnswers[questionId] = normalized.join(";");
        } else if (typeof answerValue === "string") {
          formattedAnswers[questionId] = answerValue.replace(/"/g, "").trim();
        } else {
          formattedAnswers[questionId] = answerValue;
        }
      });

      console.log("Attempt Submit Debug:", {
        attemptId,
        answersCount: Object.keys(formattedAnswers).length,
        totalQuestions: mock.questions.length,
        sampleAnswers: Object.entries(formattedAnswers).slice(0, 2),
        formattedAnswers
      });

      const res = await fetch(`/api/mock/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          attemptId: attemptId,
          timeSpent: mock.duration ? mock.duration * 60 - timeLeft : 0,
          totalQuestions: mock.questions.length,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit attempt");
      }

      const data = await res.json();
      router.push(`/mocks/${id}/result/${data.attemptId || attemptId}`);
    } catch (err: any) {
      setError(err.message || "Failed to submit attempt.");
    } finally {
      setLoading(false);
    }
  };

  const clearCurrentAnswer = () => {
    if (!mock) return;
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[mock.questions[currentIndex].id];
      return updated;
    });
  };

  // Loading / Error / Empty states
  if (loading && !mock)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading test...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );

  if (!mock)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center">
          <div className="text-gray-700 text-lg font-semibold mb-2">
            Test Not Found
          </div>
          <p className="text-gray-600 mb-4">
            The requested test could not be found.
          </p>
          <Button
            onClick={() => router.push("/mocks")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Browse Tests
          </Button>
        </div>
      </div>
    );

  const currentQuestion = mock.questions[currentIndex];
  const totalQuestions = mock.questions.length;
  const attemptedQuestions = Object.keys(answers).length;
  const bookmarkedQuestions = Object.values(bookmarked).filter(Boolean).length;
  const totalDuration = mock.duration || 0;

  // Safety check: If no current question, show error
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-center">
          <div className="text-gray-700 text-lg font-semibold mb-2">
            No Questions Available
          </div>
          <p className="text-gray-600 mb-4">
            This test doesn&apos;t have any questions yet.
          </p>
          <Button
            onClick={() => router.push("/mocks")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Browse Tests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Main Area */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <HeaderStats
            title={mock.title}
            totalQuestions={totalQuestions}
            attemptedQuestions={attemptedQuestions}
            bookmarkedQuestions={bookmarkedQuestions}
            timeLeft={timeLeft}
            isBookmarked={bookmarked[currentQuestion.id] || false}
            onToggleBookmark={toggleBookmark}
            totalDuration={totalDuration}
          />

          <QuestionRenderer
            question={currentQuestion}
            answers={answers}
            setAnswers={setAnswers}
            bookmarked={bookmarked}
            toggleBookmark={toggleBookmark}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
          />

          {/* Bottom Navigation */}
          <div className="flex justify-between items-center border-t pt-4">
            {/* Previous on extreme left */}
            <Button
              onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
              disabled={currentIndex === 0}
              variant="outline"
              className="border-purple-300 text-purple-800 hover:text-white hover:bg-purple-800"
            >
              Previous
            </Button>

            {/* Right-side buttons */}
            <div className="flex gap-3">
              {answers[mock.questions[currentIndex].id] && (
                <Button
                  variant="outline"
                  onClick={clearCurrentAnswer}
                  className="border-red-300 text-red-700 hover:bg-red-700 hover:text-white"
                >
                  Clear Response
                </Button>
              )}

              {currentIndex === mock.questions.length - 1 ? (
                <Button
                  onClick={submitAttempt}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? "Submitting..." : "Submit Test"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(i + 1, mock.questions.length - 1)
                    )
                  }
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <QuestionNavigation
        questions={mock.questions}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        visitedQuestions={visitedQuestions}
        answers={answers}
        bookmarked={bookmarked}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        showCalculator={() => setShowCalculator(true)}
        submitAttempt={submitAttempt}
        loading={loading}
      />

      {/* Calculator Modal */}
      <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-purple-800">
              <span>Scientific Calculator</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCalculator(false)}
                className="h-8 w-8 text-purple-800 hover:bg-purple-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ScientificCalculator />
        </DialogContent>
      </Dialog>
    </div>
  );
}
