// components/MockAttempt/MockAttemptPage.tsx
"use client";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import {
  Clock,
  Bookmark,
  Calculator,
  X,
  // Check,
  // AlertCircle,
} from "lucide-react";
import ScientificCalculator from "./ScientificCalculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuestionType = "MCQ" | "MSQ" | "DESCRIPTIVE";

type Question = {
  id: string;
  question: string;
  type: "MCQ" | "DESCRIPTIVE";
  options: string[];
  answer: string;
  explanation?: string;
};

type MockTest = {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  difficulty: string;
  createdAt: string;
  updatedAt: string;
};

export default function MockAttemptPage() {
  const router = useRouter();
  const { id, attemptId } = useParams<{
    id: string;
    attemptId: string;
  }>();


  const [mock, setMock] = useState<MockTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1 hour in seconds
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [showCalculator, setShowCalculator] = useState(false);
  const { setTheme, theme } = useTheme();
  const previousTheme = useRef<string | undefined>(undefined);

  const [selectedType, setSelectedType] = useState<"ALL" | QuestionType>("ALL");

useEffect(() => {
  // Store the original theme only once
  if (!previousTheme.current) previousTheme.current = theme;

  // Force light mode for this route
  setTheme("light");

  return () => {
    // Restore the theme when leaving this route
    if (previousTheme.current) setTheme(previousTheme.current);
  };
}, [theme, setTheme]);
  // Fetch mock details
  useEffect(() => {
    const fetchMock = async () => {
      try {
        const res = await fetch(`/api/mock/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load mock");
        setMock(data.mock);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMock();
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      submitAttempt();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Mark question as visited when displayed
  useEffect(() => {
    if (mock && mock.questions[currentIndex]) {
      setVisitedQuestions((prev) => ({
        ...prev,
        [mock.questions[currentIndex].id]: true,
      }));
    }
  }, [currentIndex, mock]);

  const handleSelectOption = (option: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: option });
  };

  const toggleBookmark = () => {
    setBookmarked({
      ...bookmarked,
      [currentQuestion.id]: !bookmarked[currentQuestion.id],
    });
  };

  const submitAttempt = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mock/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers,attemptId: attemptId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit attempt");
      router.push(`/mocks/${id}/result/${attemptId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = (q: Question) => {
    const globalIndex = mock!.questions.indexOf(q);
    const isVisited = visitedQuestions[q.id];
    const isAnswered = answers[q.id] && answers[q.id].length > 0;
    const isCurrent = currentIndex === globalIndex;
    const isBookmarked = bookmarked[q.id];

    if (isCurrent) return "bg-purple-100 border-purple-400 text-purple-800";
    if (isBookmarked) return "bg-blue-100 border-blue-400 text-blue-800";
    if (isAnswered) return "bg-green-100 border-green-400 text-green-800";
    if (isVisited && !isAnswered)
      return "bg-red-100 border-red-400 text-red-800";
    return "bg-white border-gray-200";
  };

  if (loading && !mock) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!mock) return <div className="p-6">Mock not found</div>;

  const currentQuestion = mock.questions[currentIndex];

  // Calculate stats
  const totalQuestions = mock.questions.length;
  const attemptedQuestions = Object.keys(answers).length;
  const bookmarkedQuestions = Object.values(bookmarked).filter(Boolean).length;

  const filteredQuestions =
    selectedType === "ALL"
      ? mock?.questions || []
      : mock?.questions.filter((q) => q.type === selectedType) || [];

  const handleTypeChange = (type: "ALL" | QuestionType) => {
    setSelectedType(type);

    if (!mock) return;

    if (type === "ALL") {
      setCurrentIndex(0);
    } else {
      const firstIndex = mock.questions.findIndex((q) => q.type === type);
      if (firstIndex !== -1) setCurrentIndex(firstIndex);
    }
  };

  // Format time
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Main Question Area */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Header with stats */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">
                Attempting : {mock.title}
              </h1>
              {/* <p className="text-gray-600 mt-1">{mock.description}</p> */}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Stats tracker */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Total:
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm font-medium">
                    {totalQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Attempted:
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                    {attemptedQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Bookmarked:
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
                    {bookmarkedQuestions}
                  </span>
                </div>
              </div>

              {/* Timer and bookmark */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800">
                    {hours.toString().padStart(2, "0")}:
                    {minutes.toString().padStart(2, "0")}:
                    {seconds.toString().padStart(2, "0")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleBookmark}
                  className={`h-9 w-9 ${
                    bookmarked[currentQuestion.id]
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : ""
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      bookmarked[currentQuestion.id] ? "fill-blue-400" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* Current Question */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Question {currentIndex + 1}
              </h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {currentQuestion.type}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <p className="text-gray-800 ">{currentQuestion.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {["MCQ", "MSQ"].includes(currentQuestion.type) ? (
                currentQuestion.options.map((option, i) => (
                  <Button
                    key={i}
                    variant={
                      answers[currentQuestion.id] === option
                        ? "default"
                        : "outline"
                    }
                    className={`w-full justify-start text-left h-auto py-3 ${
                      answers[currentQuestion.id] === option
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "text-black hover:bg-purple-50 hover:text-black border-gray-200"
                    }`}
                    onClick={() => handleSelectOption(option)}
                  >
                    <span
                      className={`mr-3 font-medium ${
                        answers[currentQuestion.id] === option
                          ? "text-purple-200 dark:text-purple-200"
                          : "text-purple-800 dark:text-purple-800"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="text-left">{option}</span>
                  </Button>
                ))
              ) : currentQuestion.type === "DESCRIPTIVE" ? (
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) =>
                    setAnswers({
                      ...answers,
                      [currentQuestion.id]: e.target.value,
                    })
                  }
                  rows={4}
                />
              ) : null}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between border-t pt-4">
    

            <Button
              onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
              disabled={currentIndex === 0}
              variant="outline"
              className="border-purple-300 text-purple-800 hover:text-white hover:bg-purple-800"
            >
              Previous
            </Button>
            <div className="flex gap-2">
                          {/* ✅ Clear Response (only visible if an answer exists) */}
    {answers[mock.questions[currentIndex].id] && (
      <Button
        variant="outline"
        onClick={() =>
          setAnswers((prev) => {
            const updated = { ...prev };
            delete updated[mock.questions[currentIndex].id]; // clear answer for current Q
            return updated;
          })
        }
        className="border-red-300 text-red-700 hover:bg-red-700 hover:text-white"
      >
        Clear Response
      </Button>
    )}
              <Button
                variant="outline"
                onClick={() => setShowCalculator(true)}
                className="flex items-center gap-2 border-purple-300 text-purple-800 hover:text-purple-900 hover:border-purple-400"
              >
                <Calculator className="w-4 h-4" />
                Calculator
              </Button>
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

      {/* Question Navigation Sidebar */}
      <div className="lg:w-80 p-4 bg-white border-l">
        <h3 className="font-bold text-lg mb-4 text-purple-800">Questions</h3>

       <div className="mb-4">
  <div className="flex gap-2 overflow-x-auto pb-2">
    {["ALL", "MCQ", "MSQ", "DESCRIPTIVE"].map((type) => (
      <Button
        key={type}
        variant={selectedType === type ? "default" : "outline"}
        size="sm"
        className={`flex-shrink-0 text-xs ${
          selectedType === type
            ? "bg-purple-600 hover:bg-purple-700 text-white"
            : "border-purple-300 text-purple-800"
        }`}
        onClick={() =>
          handleTypeChange(type === "ALL" ? "ALL" : (type as QuestionType))
        }
      >
        {type === "ALL"
          ? `All (${mock?.questions.length || 0})`
          : `${type} (${
              mock?.questions.filter((q) => q.type === type).length || 0
            })`}
      </Button>
    ))}
  </div>
</div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[60vh]">
          {filteredQuestions.map((q) => {
            const globalIndex = mock!.questions.indexOf(q);
            return (
              <Button
                key={q.id}
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(globalIndex)}
                className={`h-10 w-full ${getButtonClass(q)} ${
                  bookmarked[q.id] ? "border-2" : ""
                }`}
              >
                {globalIndex + 1}
              </Button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 space-y-2 text-sm text-black">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-400"></div>
            <span>Current Question</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-400"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-400"></div>
            <span>Visited but not answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div>
            <span>Bookmarked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border border-gray-300"></div>
            <span>Unvisited</span>
          </div>
        </div>
      </div>

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
