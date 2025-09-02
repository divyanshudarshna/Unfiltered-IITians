import { Button } from "@/components/ui/button";
import { Question, QuestionType } from "./types";

interface QuestionNavigationProps {
  questions: Question[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  visitedQuestions: Record<string, boolean>;
  answers: Record<string, string | string[]>;
  bookmarked: Record<string, boolean>;
  selectedType: "ALL" | QuestionType;
  setSelectedType: (type: "ALL" | QuestionType) => void;
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
}: QuestionNavigationProps) {
  const getButtonClass = (q: Question) => {
    const globalIndex = questions.indexOf(q);
    const isVisited = visitedQuestions[q.id];
    const isAnswered = answers[q.id] && (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : answers[q.id].length > 0);
    const isCurrent = currentIndex === globalIndex;
    const isBookmarked = bookmarked[q.id];

    if (isCurrent) return "bg-purple-100 border-purple-400 text-purple-800";
    if (isBookmarked) return "bg-blue-100 border-blue-400 text-blue-800";
    if (isAnswered) return "bg-green-100 border-green-400 text-green-800";
    if (isVisited && !isAnswered) return "bg-red-100 border-red-400 text-red-800";
    return "bg-white border-gray-200";
  };

  const filteredQuestions =
    selectedType === "ALL"
      ? questions
      : questions.filter((q) => q.type === selectedType);

  return (
    <div className="lg:w-80 p-4 bg-white border-l">
      <h3 className="font-bold text-lg mb-4 text-purple-800">Questions</h3>

      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["ALL", "MCQ", "MSQ", "DESCRIPTIVE", "NAT"].map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              className={`flex-shrink-0 text-xs ${
                selectedType === type
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-purple-300 text-purple-800"
              }`}
              onClick={() => setSelectedType(type === "ALL" ? "ALL" : type as QuestionType)}
            >
              {type === "ALL"
                ? `All (${questions.length})`
                : `${type} (${questions.filter((q) => q.type === type).length})`}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[60vh]">
        {filteredQuestions.map((q) => {
          const globalIndex = questions.indexOf(q);
          return (
            <Button
              key={q.id}
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(globalIndex)}
              className={`h-10 w-full ${getButtonClass(q)} ${bookmarked[q.id] ? "border-2" : ""}`}
            >
              {globalIndex + 1}
            </Button>
          );
        })}
      </div>

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
  );
}