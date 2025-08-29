"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  Clock,
  HelpCircle
} from "lucide-react";

interface QuizProps {
  quizId: string;
  onComplete: (score: number, total: number) => void;
  onCancel: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// Mock quiz data - in a real app, this would come from an API
const mockQuizzes: Record<string, { title: string; questions: Question[] }> = {
  "quiz-1": {
    title: "Introduction to React",
    questions: [
      {
        id: "q1",
        question: "What is React?",
        options: [
          "A programming language",
          "A JavaScript library for building user interfaces",
          "A database management system",
          "A design framework"
        ],
        correctAnswer: 1,
        explanation: "React is a JavaScript library for building user interfaces, particularly web applications."
      },
      {
        id: "q2",
        question: "Which company maintains React?",
        options: [
          "Google",
          "Microsoft",
          "Facebook (Meta)",
          "Twitter"
        ],
        correctAnswer: 2,
        explanation: "React is maintained by Facebook (now Meta)."
      },
      {
        id: "q3",
        question: "What is JSX?",
        options: [
          "A JavaScript extension for XML",
          "A new programming language",
          "A database query language",
          "A CSS framework"
        ],
        correctAnswer: 0,
        explanation: "JSX is a JavaScript syntax extension that allows you to write HTML-like code in JavaScript."
      },
      {
        id: "q4",
        question: "Which hook is used for side effects in functional components?",
        options: [
          "useState",
          "useEffect",
          "useContext",
          "useReducer"
        ],
        correctAnswer: 1,
        explanation: "The useEffect hook is used for side effects in functional components."
      },
      {
        id: "q5",
        question: "What is the virtual DOM?",
        options: [
          "A lightweight copy of the real DOM",
          "A 3D rendering engine",
          "A browser extension",
          "A server-side rendering technique"
        ],
        correctAnswer: 0,
        explanation: "The virtual DOM is a lightweight copy of the real DOM that React uses to optimize updates."
      }
    ]
  },
  "quiz-2": {
    title: "Advanced React Concepts",
    questions: [
      {
        id: "q1",
        question: "What is the purpose of React.memo?",
        options: [
          "To memoize component rendering",
          "To manage state",
          "To handle routing",
          "To create context"
        ],
        correctAnswer: 0,
        explanation: "React.memo is a higher-order component that memoizes the rendering of a component to prevent unnecessary re-renders."
      },
      {
        id: "q2",
        question: "Which method is used to update state in a class component?",
        options: [
          "this.updateState()",
          "this.setState()",
          "this.modifyState()",
          "this.changeState()"
        ],
        correctAnswer: 1,
        explanation: "In class components, state is updated using the this.setState() method."
      },
      {
        id: "q3",
        question: "What is the Context API used for?",
        options: [
          "Managing global state without prop drilling",
          "Handling form validation",
          "Creating animations",
          "Making API calls"
        ],
        correctAnswer: 0,
        explanation: "The Context API is used for managing global state without having to pass props through multiple levels of components."
      },
      {
        id: "q4",
        question: "Which hook should be used for performance optimization?",
        options: [
          "useMemo",
          "useState",
          "useEffect",
          "useContext"
        ],
        correctAnswer: 0,
        explanation: "useMemo is used to memoize expensive calculations and optimize performance."
      }
    ]
  }
};

export default function Quiz({ quizId, onComplete, onCancel }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Get quiz data - in a real app, this would be fetched from an API
  const quizData = mockQuizzes[quizId] || mockQuizzes["quiz-1"];
  const questions = quizData.questions;
  const currentQ = questions[currentQuestion];

  const handleAnswerSelect = (index: number) => {
    if (showResult || quizCompleted) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    // Check if answer is correct
    if (selectedAnswer === currentQ.correctAnswer) {
      setScore(score + 1);
    }

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      onComplete(score, questions.length);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (quizCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500/10 p-4 rounded-full">
                <Trophy className="h-12 w-12 text-green-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
            <p className="text-slate-300 mb-6">
              You scored {score} out of {questions.length} questions correctly.
            </p>
            
            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <div className="text-4xl font-bold text-white mb-2">
                {Math.round((score / questions.length) * 100)}%
              </div>
              <Progress value={(score / questions.length) * 100} className="h-2" />
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                variant="outline" 
                className="border-slate-700 text-slate-300 hover:bg-slate-700"
                onClick={onCancel}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
              
              {score < questions.length / 2 && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setCurrentQuestion(0);
                    setSelectedAnswer(null);
                    setShowResult(false);
                    setScore(0);
                    setQuizCompleted(false);
                  }}
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          className="text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
        
        <div className="flex items-center text-slate-400">
          <Clock className="h-4 w-4 mr-1" />
          <span className="text-sm">No time limit</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <Badge variant="outline" className="bg-slate-800 text-slate-300">
            <HelpCircle className="h-3 w-3 mr-1" />
            {quizData.title}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-white">
            {currentQ.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  selectedAnswer === index
                    ? showResult
                      ? index === currentQ.correctAnswer
                        ? "bg-green-500/10 border-green-500 text-green-300"
                        : "bg-red-500/10 border-red-500 text-red-300"
                      : "bg-blue-500/10 border-blue-500 text-blue-300"
                    : "bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
                )}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult || quizCompleted}
              >
                <div className="flex items-center">
                  {showResult && (
                    <>
                      {index === currentQ.correctAnswer ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                      ) : selectedAnswer === index ? (
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      ) : (
                        <div className="w-5 h-5 mr-3 rounded-full border border-slate-600" />
                      )}
                    </>
                  )}
                  {!showResult && selectedAnswer === index && (
                    <div className="w-5 h-5 mr-3 rounded-full bg-blue-500" />
                  )}
                  {!showResult && selectedAnswer !== index && (
                    <div className="w-5 h-5 mr-3 rounded-full border border-slate-600" />
                  )}
                  {option}
                </div>
              </button>
            ))}
          </div>

          {showResult && currentQ.explanation && (
            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
              <p className="text-sm text-slate-300">{currentQ.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={() => {
            if (currentQuestion > 0) {
              setCurrentQuestion(currentQuestion - 1);
              setSelectedAnswer(null);
              setShowResult(false);
            }
          }}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        {!showResult ? (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
          >
            Check Answer
          </Button>
        ) : (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleNext}
          >
            {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}