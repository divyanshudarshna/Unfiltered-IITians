import { Button } from "@/components/ui/button";

export default function QuestionNavigation({ questions, currentIndex, answers, seen, bookmarked, onJump, onOpenCalculator, onSubmit, onClear }) {
  const getStatusColor = (qid, idx) => {
    if (currentIndex === idx) return "bg-blue-500 text-white";
    if (answers[qid]) return "bg-green-500 text-white";
    if (seen[qid]) return "bg-red-500 text-white";
    return "bg-gray-200";
  };

  return (
    <div className="w-64 bg-white border-l p-4 flex flex-col justify-between">
      <div>
        <h3 className="font-bold mb-3">Question Navigation</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={`w-10 h-10 rounded ${getStatusColor(q.id, i)} ${bookmarked[q.id] ? "ring-2 ring-yellow-400" : ""}`}
              onClick={() => onJump(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Button className="w-full mb-2" onClick={onOpenCalculator}>Scientific Calculator</Button>
        <Button className="w-full mb-2" variant="outline" onClick={onClear}>Clear Response</Button>
        <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={onSubmit}>Submit Test</Button>
      </div>
    </div>
  );
}
