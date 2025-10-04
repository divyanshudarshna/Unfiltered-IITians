import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Question, AnswerState } from "./types";

interface QuestionRendererProps {
  question: Question;
  answers: AnswerState;
  setAnswers: (answers: AnswerState) => void;
  bookmarked: Record<string, boolean>;
  toggleBookmark: () => void;
  currentIndex: number;
  totalQuestions: number;
}

// Enhanced cleaning function
const cleanOption = (option: string) => {
  return option.replace(/["']/g, "").trim();
};

export default function QuestionRenderer({
  question,
  answers,
  setAnswers,
  bookmarked,
  toggleBookmark,
  currentIndex,
  totalQuestions,
}: QuestionRendererProps) {
  const handleSelectOption = (option: string, index: number) => {
    const cleanedOption = cleanOption(option);

    if (question.type === "MSQ") {
      const currentAnswers = (answers[question.id] as string[]) || [];
      const newAnswers = currentAnswers.includes(cleanedOption)
        ? currentAnswers.filter((a) => a !== cleanedOption)
        : [...currentAnswers, cleanedOption];

      setAnswers({ ...answers, [question.id]: newAnswers });
    } else {
      setAnswers({ ...answers, [question.id]: cleanedOption });
    }
  };

  const isOptionSelected = (index: number) => {
    const cleanedOption = cleanOption(question.options[index]);

    if (question.type === "MSQ") {
      return (answers[question.id] as string[])?.includes(cleanedOption) || false;
    }
    return answers[question.id] === cleanedOption;
  };

  const getMSQAnswersDisplay = () => {
    if (question.type !== "MSQ") return "";
    const currentAnswers = (answers[question.id] as string[]) || [];
    return currentAnswers.join("; ");
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Question {currentIndex + 1} of {totalQuestions}
        </h2>
        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
          {question.type}
        </span>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-800 dark:text-gray-200">{question.question}</p>
      </div>

      <div className="space-y-3">
        {question.type === "MCQ" && (
          <>
            {question.options.map((option, i) => {
              const cleanedOption = cleanOption(option);
              const selected = isOptionSelected(i);

              return (
                <Button
                  key={i}
                  variant={selected ? "default" : "outline"}
                  className={`w-full justify-start text-left h-auto py-3 ${
                    selected
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "text-black dark:text-white hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-black dark:hover:text-white border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => handleSelectOption(option, i)}
                >
                  <span className="mr-3 font-medium">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span className="text-left">{cleanedOption}</span>
                </Button>
              );
            })}
          </>
        )}

        {question.type === "MSQ" && (
          <>
            <div className="space-y-2">
              {question.options.map((option, i) => {
                const cleanedOption = cleanOption(option);
                const isSelected = isOptionSelected(i);

                return (
                  <div
                    key={i}
                    className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                    onClick={() => handleSelectOption(option, i)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectOption(option, i)}
                      className="mr-3"
                    />
                    <span className="font-medium text-muted-foreground mr-2">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 flex-1">
                      {cleanedOption}
                    </span>
                  </div>
                );
              })}
            </div>

            {getMSQAnswersDisplay() && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Selected answers: {getMSQAnswersDisplay()}
                </p>
              </div>
            )}
          </>
        )}

        {question.type === "DESCRIPTIVE" && (
          <textarea
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
            placeholder="Type your answer here..."
            value={(answers[question.id] as string) || ""}
            onChange={(e) =>
              setAnswers({
                ...answers,
                [question.id]: e.target.value,
              })
            }
            rows={4}
          />
        )}

        {question.type === "NAT" && (
          <div className="space-y-3">
            <input
              type="number"
              step="any"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
              placeholder="Enter numerical answer..."
              value={(answers[question.id] as string) || ""}
              onChange={(e) =>
                setAnswers({
                  ...answers,
                  [question.id]: e.target.value,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Enter a numerical value (integer or decimal)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
