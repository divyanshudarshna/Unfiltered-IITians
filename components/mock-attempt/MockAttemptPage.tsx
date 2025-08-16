"use client";

import { useEffect, useState } from "react";
import QuestionHeader from "./QuestionHeader";
import QuestionContent from "./QuestionContent";
import QuestionNavigation from "./QuestionNavigation";
import CalculatorModal from "./CalculatorModal";

export default function MockAttemptPage({ mockId, attemptId }: { mockId: string; attemptId: string }) {
  const [mock, setMock] = useState(null);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [seen, setSeen] = useState({});
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const fetchMock = async () => {
      const res = await fetch(`/api/mock/${mockId}`);
      const data = await res.json();
      setMock(data.mock);
      setTimeLeft(data.mock.duration * 60);
    };
    fetchMock();
  }, [mockId]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswer = (qid: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
    setSeen(prev => ({ ...prev, [qid]: true }));
  };

  if (!mock) return <div className="p-6">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen flex">
      <div className="flex-1 p-4">
        <QuestionHeader 
          title={mock.title} 
          description={mock.description} 
          timeLeft={timeLeft}
          sections={Array.from(new Set(mock.questions.map(q => q.section)))}
        />

        <QuestionContent 
          question={mock.questions[currentIndex]}
          index={currentIndex}
          total={mock.questions.length}
          answer={answers[mock.questions[currentIndex].id]}
          onAnswer={handleAnswer}
          onNext={() => setCurrentIndex(i => Math.min(i + 1, mock.questions.length - 1))}
          onPrev={() => setCurrentIndex(i => Math.max(i - 1, 0))}
          onBookmark={() => setBookmarked(prev => ({ ...prev, [mock.questions[currentIndex].id]: !prev[mock.questions[currentIndex].id] }))}
          bookmarked={bookmarked[mock.questions[currentIndex].id]}
        />
      </div>

      <QuestionNavigation
        questions={mock.questions}
        currentIndex={currentIndex}
        answers={answers}
        seen={seen}
        bookmarked={bookmarked}
        onJump={setCurrentIndex}
        onOpenCalculator={() => setShowCalculator(true)}
        onSubmit={() => alert("Submit Test")}
        onClear={() => handleAnswer(mock.questions[currentIndex].id, "")}
      />

      <CalculatorModal open={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>
  );
}
