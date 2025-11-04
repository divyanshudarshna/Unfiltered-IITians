"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, BookOpen, Trophy, Brain, AlertCircle, BarChart3, RotateCcw } from "lucide-react";

interface QuizProps {
  contentId: string;
  courseId: string;
  onComplete: (score: number, total: number, attemptedQuestions: AttemptedQuestion[]) => void;
  onCancel: () => void;
}

interface Question {
  type: "MCQ" | "MSQ" | "NAT";
  question: string;
  options?: string[];
  answer: string | string[];
  explanation?: string;
}

interface AttemptedQuestion {
  questionIndex: number;
  userAnswer: string | string[];
  isCorrect: boolean;
  correctAnswer: string | string[];
  explanation?: string;
  type: "MCQ" | "MSQ" | "NAT";
  questionText: string;
}

export default function Quiz({ contentId, courseId, onComplete, onCancel }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(string | string[] | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [submitted, setSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [score, setScore] = useState(0);
  const [attemptedQuestions, setAttemptedQuestions] = useState<AttemptedQuestion[]>([]);
  const [existingProgress, setExistingProgress] = useState<any>(null);
useEffect(() => {
  const fetchQuizAndProgress = async () => {
    try {
      setLoading(true);

      // Fetch quiz questions
      const res = await fetch(`/api/courses/quiz/${contentId}`);
      const quizJson = await res.json();
      if (res.ok) {
        setQuestions(quizJson.questions || []);
        setAnswers(new Array((quizJson.questions || []).length).fill(null));
      }

      // Fetch existing progress
      const progressRes = await fetch(
        `/api/courses/progress?courseId=${courseId}&contentId=${contentId}`
      );

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        if (progressData.length > 0) {
          const progress = progressData[0]; // already filtered by contentId

          // If quiz was completed previously
          if (progress.quizScore !== null) {
            setExistingProgress(progress);
            setShowSummary(true);
            setScore(progress.quizScore);

            // Parse attempted questions if they exist
            if (progress.attemptedQuestions) {
              try {
                const parsedQuestions = JSON.parse(progress.attemptedQuestions);
                setAttemptedQuestions(parsedQuestions);

                // Map previously attempted answers
                const resumedAnswers = parsedQuestions.map(q => q.userAnswer);
                setAnswers(resumedAnswers);
              } catch (e) {
                console.error("Failed to parse attempted questions:", e);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load quiz or progress:", e);
    } finally {
      setLoading(false);
    }
  };

  fetchQuizAndProgress();
}, [contentId, courseId]);


  // Check if current question has been attempted
  const isQuestionAttempted = (index: number) => {
    return attemptedQuestions.some(q => q.questionIndex === index);
  };

  // Get attempted question data
  const getAttemptedQuestion = (index: number) => {
    return attemptedQuestions.find(q => q.questionIndex === index);
  };

  // handle MCQ select
  const handleMCQ = (option: string) => {
    if (submitted || isQuestionAttempted(currentIdx)) return;
    const updated = [...answers];
    updated[currentIdx] = option;
    setAnswers(updated);
  };

  // handle MSQ select
  const handleMSQ = (option: string) => {
    if (submitted || isQuestionAttempted(currentIdx)) return;
    const updated = [...answers];
    const current = (updated[currentIdx] as string[]) || [];
    if (current.includes(option)) {
      updated[currentIdx] = current.filter((o) => o !== option);
    } else {
      updated[currentIdx] = [...current, option];
    }
    setAnswers(updated);
  };

  // handle NAT input
  const handleNAT = (value: string) => {
    if (submitted || isQuestionAttempted(currentIdx)) return;
    const updated = [...answers];
    updated[currentIdx] = value;
    setAnswers(updated);
  };

  // check correctness per question
  const checkAnswer = () => {
    const q = questions[currentIdx];
    const ans = answers[currentIdx];

    let isCorrect = false;

    if (q.type === "MCQ" && typeof ans === "string") {
      isCorrect = ans === q.answer;
    } else if (q.type === "MSQ" && Array.isArray(ans)) {
      const correct = Array.isArray(q.answer) ? q.answer : [q.answer];
      isCorrect =
        ans.length === correct.length && ans.every((a) => correct.includes(a));
    } else if (q.type === "NAT" && typeof ans === "string") {
      isCorrect = ans.trim() === String(q.answer).trim();
    }

    // Store the attempted question
    const attemptedQuestion: AttemptedQuestion = {
      questionIndex: currentIdx,
      userAnswer: ans || "",
      isCorrect,
      correctAnswer: q.answer,
      explanation: q.explanation,
      type: q.type,
      questionText: q.question
    };
    
    setAttemptedQuestions(prev => {
      // Remove if already exists and add updated one
      const filtered = prev.filter(q => q.questionIndex !== currentIdx);
      return [...filtered, attemptedQuestion];
    });
    
    setFeedback(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
    } else {
      // Show summary instead of immediately completing
      setShowSummary(true);
    }
  };

  const handlePrevious = () => {
    setFeedback(null);
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    }
  };

  const handleQuestionNav = (index: number) => {
    setFeedback(null);
    setCurrentIdx(index);
  };
const handleFinishQuiz = async () => {
  setSubmitted(true);

  // Call parent callback
  onComplete(score, questions.length, attemptedQuestions);

  try {
    const res = await fetch("/api/courses/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        contentId,
        completed: true, // quiz considered completed
        progress: Math.round((score / questions.length) * 100),
        quizScore: score,
        totalQuizQuestions: questions.length,
        attemptedQuestions, // backend will stringify
      }),
      credentials: "include",
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      console.error("Failed to save quiz progress:", errorBody);
      return;
    }

    console.log("✅ Quiz progress saved successfully!");
  } catch (error) {
    console.error("Error saving quiz progress:", error);
  }
};


  const handleRestartQuiz = () => {
    setAnswers(new Array(questions.length).fill(null));
    setAttemptedQuestions([]);
    setScore(0);
    setCurrentIdx(0);
    setFeedback(null);
    setShowSummary(false);
    setExistingProgress(null);
    
    // Delete existing progress from server
    fetch("/api/courses/progress", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: courseId,
        contentId: contentId,
      }),
    }).catch(error => {
      console.error("Error deleting progress:", error);
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading quiz questions...</p>
      </div>
    );
  }

  if (showSummary) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="space-y-6 p-4 max-w-4xl mx-auto">
        <div className="text-center p-6 bg-gray-900 rounded-xl border">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-primary mb-2">Quiz Summary</h2>
          <div className="flex justify-center items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold">{score}</span>
            <span className="text-xl text-muted-foreground">/ {questions.length}</span>
            <span className="text-xl font-semibold">({percentage}%)</span>
          </div>
          
          <div className="w-full bg-secondary rounded-full h-4 mb-6 mx-auto max-w-md">
            <div 
              className="h-4 rounded-full transition-all duration-700" 
              style={{ 
                width: `${percentage}%`,
                background: percentage < 33 ? 'linear-gradient(to right, #ef4444, #f97316)' : 
                           percentage < 66 ? 'linear-gradient(to right, #f59e0b, #eab308)' : 
                           'linear-gradient(to right, #10b981, #22c55e)'
              }}
            ></div>
          </div>
          
          <div className={`p-4 rounded-lg mt-6 text-left ${
            percentage < 33 ? 'bg-red-50 text-red-800 border border-red-200' :
            percentage < 66 ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
            'bg-green-50 text-green-800 border border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              {percentage < 33 ? (
                <>
                  <AlertCircle className="h-6 w-6 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Needs Improvement</h3>
                    <p>Review the course materials regularly and focus on understanding the core concepts. Consider taking notes and revisiting challenging topics.</p>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>Spend more time on each lesson</li>
                      <li>Take detailed notes</li>
                      <li>Review materials before attempting the quiz again</li>
                    </ul>
                  </div>
                </>
              ) : percentage < 66 ? (
                <>
                  <Brain className="h-6 w-6 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Good Effort</h3>
                    <p>You're on the right track! With a bit more practice and review, you'll master this material. Focus on the questions you missed.</p>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>Review incorrect answers</li>
                      <li>Practice similar questions</li>
                      <li>Focus on weak areas</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <Trophy className="h-6 w-6 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Excellent Work!</h3>
                    <p>You've demonstrated a strong understanding of this material. Keep up the great work and consider challenging yourself with more advanced topics.</p>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>Continue to the next lesson</li>
                      <li>Try bonus challenges if available</li>
                      <li>Help others who might be struggling</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Question Review
          </h3>
          <div className="space-y-4">
            {attemptedQuestions.sort((a, b) => a.questionIndex - b.questionIndex).map((attempt, index) => (
              <Card key={index} className={attempt.isCorrect ? "border-green-200" : "border-red-200"}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Question {attempt.questionIndex + 1}</CardTitle>
                    <Badge variant={attempt.isCorrect ? "default" : "destructive"} className="ml-2">
                      {attempt.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{attempt.questionText}</p>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Your answer:</p>
                      <p className={attempt.isCorrect ? "text-green-700" : "text-red-700"}>
                        {Array.isArray(attempt.userAnswer) ? attempt.userAnswer.join(", ") : attempt.userAnswer}
                      </p>
                    </div>
                    {!attempt.isCorrect && (
                      <div>
                        <p className="font-medium">Correct answer:</p>
                        <p className="text-green-700">
                          {Array.isArray(attempt.correctAnswer) ? attempt.correctAnswer.join(", ") : attempt.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                  {attempt.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-800">Explanation:</p>
                      <p className="text-sm text-blue-700">{attempt.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button variant="outline" onClick={handleRestartQuiz} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Retry Quiz
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back to Course
          </Button>
          <Button onClick={handleFinishQuiz} className="flex items-center gap-2">
            Continue to Next Content <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    // This state should not be reached anymore since we're using showSummary
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Completing quiz...</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">No quiz questions available for this content.</p>
        <Button onClick={onCancel}>Return to Course</Button>
      </div>
    );
  }

  const q = questions[currentIdx];
  const ans = answers[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;
  const isAttempted = isQuestionAttempted(currentIdx);
  const attemptedQuestion = getAttemptedQuestion(currentIdx);

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      {/* Header with progress and question navigation */}
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Quiz: Question {currentIdx + 1} of {questions.length}</h2>
          <div className="flex items-center gap-2">
            <Badge variant={q.type === "MCQ" ? "default" : q.type === "MSQ" ? "secondary" : "outline"} className="capitalize">
              {q.type}
            </Badge>
            <Badge variant={isAttempted ? "default" : "outline"}>
              {isAttempted ? "Attempted" : "Not Attempted"}
            </Badge>
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {/* Question navigation dots */}
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => handleQuestionNav(index)}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentIdx === index 
                  ? 'bg-primary text-primary-foreground' 
                  : isQuestionAttempted(index)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {q.type === "MCQ" && q.options?.map((opt, idx) => {
            const isSelected = ans === opt;
            const isCorrectAnswer = opt === q.answer;
            const showFeedback = (feedback || isAttempted) && (isSelected || isCorrectAnswer);
            
            return (
              <Button
                key={idx}
                variant={isSelected ? "default" : "outline"}
                className={`w-full justify-start h-auto py-3 px-4 whitespace-normal text-left ${
                  showFeedback ? 
                    (isCorrectAnswer ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100" : 
                     isSelected ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-100" : "") 
                    : ""
                } ${isAttempted ? "cursor-default" : ""}`}
                onClick={() => handleMCQ(opt)}
                disabled={isAttempted}
              >
                <div className="flex items-center w-full">
                  {showFeedback && (
                    <span className="mr-2">
                      {isCorrectAnswer ? 
                        <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                        (isSelected ? <XCircle className="h-5 w-5 text-red-600" /> : null)
                      }
                    </span>
                  )}
                  <span className="flex-1">{opt}</span>
                </div>
              </Button>
            );
          })}

          {q.type === "MSQ" && q.options?.map((opt, idx) => {
            const selected = Array.isArray(ans) && ans.includes(opt);
            const isCorrectAnswer = Array.isArray(q.answer) ? 
              q.answer.includes(opt) : q.answer === opt;
            const showFeedback = (feedback || isAttempted) && (selected || isCorrectAnswer);
            
            return (
              <Button
                key={idx}
                variant={selected ? "default" : "outline"}
                className={`w-full justify-start h-auto py-3 px-4 whitespace-normal text-left ${
                  showFeedback ? 
                    (isCorrectAnswer ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-100" : 
                     selected ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-100" : "") 
                    : ""
                } ${isAttempted ? "cursor-default" : ""}`}
                onClick={() => handleMSQ(opt)}
                disabled={isAttempted}
              >
                <div className="flex items-center w-full">
                  {showFeedback && (
                    <span className="mr-2">
                      {isCorrectAnswer ? 
                        <CheckCircle2 className="h-5 w-5 text-green-600" /> : 
                        (selected ? <XCircle className="h-5 w-5 text-red-600" /> : null)
                      }
                    </span>
                  )}
                  <span className="flex-1">{opt}</span>
                </div>
              </Button>
            );
          })}

          {q.type === "NAT" && (
            <Input
              type="text"
              value={typeof ans === "string" ? ans : ""}
              onChange={(e) => handleNAT(e.target.value)}
              disabled={isAttempted}
              placeholder="Enter your answer"
              className={`py-3 px-4 text-lg ${
                feedback || isAttempted ? 
                  (attemptedQuestion?.isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50") 
                  : ""
              }`}
            />
          )}

          {/* feedback */}
          {(feedback || isAttempted) && (
            <div
              className={`p-4 rounded-lg ${
                attemptedQuestion?.isCorrect
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              <div className="flex items-center font-semibold mb-2">
                {attemptedQuestion?.isCorrect ? 
                  <CheckCircle2 className="h-5 w-5 mr-2" /> : 
                  <XCircle className="h-5 w-5 mr-2" />
                }
                {attemptedQuestion?.isCorrect ? "Correct!" : "Incorrect!"}
                {!attemptedQuestion?.isCorrect && (
                  <span className="ml-2 text-sm font-normal">
                    Correct answer: {Array.isArray(attemptedQuestion?.correctAnswer) 
                      ? attemptedQuestion.correctAnswer.join(", ") 
                      : attemptedQuestion?.correctAnswer}
                  </span>
                )}
              </div>
              {attemptedQuestion?.explanation && (
                <p className="mt-2 text-sm">
                  💡 {attemptedQuestion.explanation}
                </p>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentIdx === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          <div className="flex gap-2 ml-auto">
            {isAttempted ? (
              <Button onClick={handleNext}>
                {currentIdx + 1 === questions.length ? "Finish Quiz" : "Next Question"}
                {currentIdx + 1 < questions.length && <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            ) : (
              <Button onClick={checkAnswer} disabled={ans === null}>
                Check Answer
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Submit & Back to Lectures Button */}
      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          onClick={handleFinishQuiz}
          className="flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Submit & Back to Lectures
        </Button>
      </div>
    </div>
  );
}