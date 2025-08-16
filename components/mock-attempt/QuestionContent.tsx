import { Button } from "@/components/ui/button";

export default function QuestionContent({ question, index, total, answer, onAnswer, onNext, onPrev, onBookmark, bookmarked }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold">Question {index + 1} of {total}</h2>
        <Button onClick={onBookmark} variant={bookmarked ? "default" : "outline"}>
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </Button>
      </div>
      <p className="mb-4">{question.question}</p>
      {question.type === "MCQ" && question.options.map((opt, i) => (
        <Button
          key={i}
          variant={answer === opt ? "default" : "outline"}
          className="w-full justify-start mb-2"
          onClick={() => onAnswer(question.id, opt)}
        >
          {String.fromCharCode(65 + i)}. {opt}
        </Button>
      ))}
      <div className="flex justify-between mt-4">
        <Button onClick={onPrev} disabled={index === 0} variant="outline">Previous</Button>
        <Button onClick={onNext} disabled={index === total - 1}>Next</Button>
      </div>
    </div>
  );
}
