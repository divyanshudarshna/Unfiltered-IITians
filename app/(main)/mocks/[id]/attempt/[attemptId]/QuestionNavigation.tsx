import { Button } from "@/components/ui/button";
import { Question, QuestionType } from "./types";
import { Calculator } from "lucide-react";

interface QuestionNavigationProps {
  questions: Question[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  visitedQuestions: Record<string, boolean>;
  answers: Record<string, string | string[]>;
  bookmarked: Record<string, boolean>;
  selectedType: "ALL" | QuestionType;
  setSelectedType: (type: "ALL" | QuestionType) => void;
  showCalculator: () => void;
  submitAttempt: () => void;
  loading: boolean;
}

export default function QuestionNavigation({
  questions,
  currentIndex,
  setCurrentIndex,
  visitedQuestions,
  answers,
  bookmarked,
  selectedType,
  setSelectedType,
  showCalculator,
  submitAttempt,
  loading,
}: QuestionNavigationProps) {
  const getButtonClass = (q: Question) => {
    const globalIndex = questions.indexOf(q);
    const isVisited = visitedQuestions[q.id];
    const isAnswered =
      answers[q.id] &&
      (Array.isArray(answers[q.id])
        ? answers[q.id].length > 0
        : answers[q.id].length > 0);
    const isCurrent = currentIndex === globalIndex;
    const isBookmarked = bookmarked[q.id];

    if (isCurrent) return "bg-purple-100 border-purple-400 text-purple-800";
    if (isBookmarked) return "bg-blue-100 border-blue-400 text-blue-800";
    if (isAnswered) return "bg-green-100 border-green-400 text-green-800";
    if (isVisited && !isAnswered)
      return "bg-red-100 border-red-400 text-red-800";
    return "bg-white border-gray-200";
  };

  const filteredQuestions =
    selectedType === "ALL"
      ? questions
      : questions.filter((q) => q.type === selectedType);

  return (
    <aside className="lg:w-80 flex flex-col bg-white border-l shadow-sm max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg text-purple-800">Questions</h3>
      </div>

      {/* Filters */}
      <div className="p-3 border-b">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["ALL", "MCQ", "MSQ", "DESCRIPTIVE", "NAT"].map((type) => (
            <Button
              key={type}
              size="sm"
              variant={selectedType === type ? "default" : "outline"}
              className={`rounded-full px-3 py-1 text-xs flex-shrink-0 ${
                selectedType === type
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-purple-300 text-purple-800 hover:border-purple-400"
              }`}
              onClick={() =>
                setSelectedType(type === "ALL" ? "ALL" : (type as QuestionType))
              }
            >
              {type === "ALL"
                ? `All (${questions.length})`
                : `${type} (${
                    questions.filter((q) => q.type === type).length
                  })`}
            </Button>
          ))}
        </div>
      </div>

      {/* Question Grid */}
      <div className="p-4">
        <div className="grid grid-cols-5 gap-2">
          {filteredQuestions.map((q) => {
            const globalIndex = questions.indexOf(q);
            return (
              <Button
                key={q.id}
                size="sm"
                variant="outline"
                onClick={() => setCurrentIndex(globalIndex)}
                className={`h-9 w-full text-black rounded-md text-xs font-medium ${getButtonClass(
                  q
                )} ${bookmarked[q.id] ? "border-2" : ""}`}
              >
                {globalIndex + 1}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Legend + Actions */}
      <div className="p-4 border-t space-y-4">
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-400"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-400"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-400"></div>
            <span>Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div>
            <span>Bookmarked</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <div className="w-4 h-4 rounded bg-white border border-gray-300"></div>
            <span>Unvisited</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={showCalculator}
            className="flex items-center gap-2 border-purple-300 text-purple-800 hover:bg-purple-50"
          >
            <Calculator className="w-4 h-4" />
            Calculator
          </Button>

            <Button
              onClick={submitAttempt}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >

              {loading ? "Submitting..." : "Submit Test"}
            </Button>
      
        </div>
      </div>
    </aside>
  );
}
