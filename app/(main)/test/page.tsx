"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Clock, Calculator } from "lucide-react";

type Question = {
  id: number;
  text: string;
  section: 'a' | 'b' | 'c';
  marks: number;
  options?: string[];
  correctAnswers?: number[];
  type: 'mcq' | 'msq' | 'nat';
};

export default function MockTestPage() {
  // Timer state
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60); // 2 hours in seconds
  const [isRunning, setIsRunning] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorInput, setCalculatorInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{[key: number]: number[]}>({});
  const [showResults, setShowResults] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  
  // Sample questions data
  const questions: Question[] = [
    {
      id: 1,
      text: "Which enzyme is responsible for the synthesis of RNA from a DNA template?",
      section: 'a',
      marks: 1,
      options: ["DNA polymerase", "RNA polymerase", "Helicase", "Ligase"],
      correctAnswers: [1],
      type: 'mcq'
    },
    {
      id: 2,
      text: "The process by which glucose is converted to pyruvate is known as:",
      section: 'a',
      marks: 1,
      options: ["Glycolysis", "Krebs cycle", "Electron transport chain", "Oxidative phosphorylation"],
      correctAnswers: [0],
      type: 'mcq'
    },
    {
      id: 3,
      text: "Which of the following are components of the lac operon in E. coli?",
      section: 'b',
      marks: 2,
      options: ["Lac Z gene", "Lac Y gene", "Lac A gene", "Lac promoter"],
      correctAnswers: [0, 1, 2, 3],
      type: 'msq'
    },
    {
      id: 4,
      text: "Which of the following techniques can be used to separate proteins based on their size?",
      section: 'b',
      marks: 2,
      options: ["SDS-PAGE", "Western blotting", "PCR", "ELISA"],
      correctAnswers: [0, 1],
      type: 'msq'
    },
    {
      id: 5,
      text: "The number of chromosomes in a human gamete is ______.",
      section: 'c',
      marks: 1,
      type: 'nat'
    },
    {
      id: 6,
      text: "The pH of a solution with hydrogen ion concentration of 1 × 10^-7 M is ______.",
      section: 'c',
      marks: 1,
      type: 'nat'
    },
    {
      id: 7,
      text: "Which of the following are functions of microtubules?",
      section: 'b',
      marks: 2,
      options: ["Chromosome segregation", "Muscle contraction", "Vesicle transport", "Maintenance of cell shape"],
      correctAnswers: [0, 2, 3],
      type: 'msq'
    },
    {
      id: 8,
      text: "The central dogma of molecular biology describes the flow of genetic information as:",
      section: 'a',
      marks: 1,
      options: ["DNA → RNA → Protein", "RNA → DNA → Protein", "Protein → RNA → DNA", "DNA → Protein → RNA"],
      correctAnswers: [0],
      type: 'mcq'
    },
    {
      id: 9,
      text: "The process of programmed cell death is called:",
      section: 'a',
      marks: 1,
      options: ["Necrosis", "Apoptosis", "Mitosis", "Meiosis"],
      correctAnswers: [1],
      type: 'mcq'
    },
    {
      id: 10,
      text: "The Michaelis-Menten constant (Km) represents:",
      section: 'a',
      marks: 1,
      options: [
        "The substrate concentration at half Vmax",
        "The enzyme concentration at half Vmax",
        "The maximum velocity of the reaction",
        "The dissociation constant of the enzyme-substrate complex"
      ],
      correctAnswers: [0, 3],
      type: 'msq'
    }
  ];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSubmitTest();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculator functions
  const handleCalculatorInput = (value: string) => {
    setCalculatorInput(prev => prev + value);
  };

  const calculateResult = () => {
    try {
      // eslint-disable-next-line no-eval
      setCalculatorInput(eval(calculatorInput).toString());
    } catch (error) {
      setCalculatorInput('Error');
    }
  };

  const clearCalculator = () => {
    setCalculatorInput('');
  };

  // Question navigation
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Answer selection
  const handleOptionSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.type === 'mcq') {
      // For MCQ, only one option can be selected
      setSelectedOptions(prev => ({
        ...prev,
        [currentQuestionIndex]: [optionIndex]
      }));
    } else if (currentQuestion.type === 'msq') {
      // For MSQ, multiple options can be selected
      setSelectedOptions(prev => {
        const currentSelections = prev[currentQuestionIndex] || [];
        if (currentSelections.includes(optionIndex)) {
          return {
            ...prev,
            [currentQuestionIndex]: currentSelections.filter(i => i !== optionIndex)
          };
        } else {
          return {
            ...prev,
            [currentQuestionIndex]: [...currentSelections, optionIndex]
          };
        }
      });
    }
    // NAT questions would need a different input method (text input)
  };

  // Test submission
  const handleSubmitTest = () => {
    setIsRunning(false);
    setTestSubmitted(true);
    setShowResults(true);
  };

  // Back to test from results
  const handleBackToTest = () => {
    setShowResults(false);
  };

  // Clear current response
  const handleClearResponse = () => {
    setSelectedOptions(prev => {
      const newSelections = {...prev};
      delete newSelections[currentQuestionIndex];
      return newSelections;
    });
  };

  // Calculate test results
  const calculateResults = () => {
    let correct = 0;
    let incorrect = 0;
    let score = 0;
    let negativeMarks = 0;
    
    questions.forEach((question, index) => {
      const userAnswers = selectedOptions[index] || [];
      
      if (question.type === 'mcq' || question.type === 'msq') {
        if (userAnswers.length === 0) return; // Unattempted
        
        const isCorrect = JSON.stringify(userAnswers.sort()) === JSON.stringify(question.correctAnswers?.sort());
        
        if (isCorrect) {
          correct++;
          score += question.marks;
        } else {
          incorrect++;
          negativeMarks += question.type === 'mcq' ? question.marks * 0.25 : question.marks * 0.5;
        }
      }
      // NAT questions would need separate handling
    });
    
    const percentage = ((score - negativeMarks) / questions.reduce((sum, q) => sum + q.marks, 0)) * 100;
    
    return {
      correct,
      incorrect,
      unattempted: questions.length - correct - incorrect,
      score: score - negativeMarks,
      negativeMarks,
      percentage: Math.max(0, percentage).toFixed(2)
    };
  };

  const results = calculateResults();

  // Get current section
  const currentSection = questions[currentQuestionIndex]?.section || 'a';

  return (
    <main className="flex min-h-screen p-4 gap-4 bg-gray-50">
      {/* Main Test Container */}
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        {/* Test Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">IIT JAM Biotechnology Mock Test - Advanced Level 5</h1>
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
            <Clock className="h-5 w-5" />
            <span id="time" className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Section Toggle */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={currentSection === 'a' ? 'default' : 'outline'} 
            onClick={() => {
              const firstSectionAIndex = questions.findIndex(q => q.section === 'a');
              if (firstSectionAIndex !== -1) setCurrentQuestionIndex(firstSectionAIndex);
            }}
          >
            Section A (MCQs)
          </Button>
          <Button 
            variant={currentSection === 'b' ? 'default' : 'outline'} 
            onClick={() => {
              const firstSectionBIndex = questions.findIndex(q => q.section === 'b');
              if (firstSectionBIndex !== -1) setCurrentQuestionIndex(firstSectionBIndex);
            }}
          >
            Section B (MSQs)
          </Button>
          <Button 
            variant={currentSection === 'c' ? 'default' : 'outline'} 
            onClick={() => {
              const firstSectionCIndex = questions.findIndex(q => q.section === 'c');
              if (firstSectionCIndex !== -1) setCurrentQuestionIndex(firstSectionCIndex);
            }}
          >
            Section C (NATs)
          </Button>
        </div>

        {/* Question Area */}
        {!showResults ? (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="question-number font-medium">Question {currentQuestionIndex + 1}</div>
              <div className={`px-2 py-1 rounded text-sm ${
                questions[currentQuestionIndex].section === 'a' ? 'bg-blue-100 text-blue-800' :
                questions[currentQuestionIndex].section === 'b' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {questions[currentQuestionIndex].section === 'a' ? 'Section A' :
                 questions[currentQuestionIndex].section === 'b' ? 'Section B' : 'Section C'}
              </div>
              <div className="text-gray-500">{questions[currentQuestionIndex].marks} Mark{questions[currentQuestionIndex].marks !== 1 ? 's' : ''}</div>
            </CardHeader>
            <CardContent>
              <div className="question-text mb-4 text-lg">
                {questions[currentQuestionIndex].text}
              </div>
              
              {questions[currentQuestionIndex].type !== 'nat' ? (
                <div className="options-container space-y-3">
                  {questions[currentQuestionIndex].options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {questions[currentQuestionIndex].type === 'mcq' ? (
                        <input
                          type="radio"
                          id={`option-${index}`}
                          name="mcq-option"
                          checked={selectedOptions[currentQuestionIndex]?.includes(index) || false}
                          onChange={() => handleOptionSelect(index)}
                          className="h-4 w-4"
                        />
                      ) : (
                        <Checkbox
                          id={`option-${index}`}
                          checked={selectedOptions[currentQuestionIndex]?.includes(index) || false}
                          onCheckedChange={() => handleOptionSelect(index)}
                        />
                      )}
                      <Label htmlFor={`option-${index}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <input
                    type="text"
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Enter your answer"
                    // You would need to implement NAT answer handling
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button 
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </Button>
            </CardFooter>
          </Card>
        ) : (
          /* Results Container */
          <Card id="results-container">
            <CardHeader>
              <h1 className="text-2xl font-bold">Test Results</h1>
              <div id="score-display" className="text-xl">Your Score: {results.score}/{questions.reduce((sum, q) => sum + q.marks, 0)}</div>
              <div id="negative-marks-display" className="text-red-500">Negative Marks: {results.negativeMarks.toFixed(2)}</div>
              <p className="text-gray-600">Detailed analysis of your performance</p>
            </CardHeader>
            <CardContent>
              {/* Stats Container */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="text-center">
                    <div id="correct-answers" className="text-3xl font-bold text-green-600">{results.correct}</div>
                    <div className="text-gray-500">Correct Answers</div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="text-center">
                    <div id="incorrect-answers" className="text-3xl font-bold text-red-600">{results.incorrect}</div>
                    <div className="text-gray-500">Incorrect Answers</div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="text-center">
                    <div id="unattempted" className="text-3xl font-bold text-yellow-600">{results.unattempted}</div>
                    <div className="text-gray-500">Unattempted</div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="text-center">
                    <div id="percentage" className="text-3xl font-bold text-blue-600">{results.percentage}%</div>
                    <div className="text-gray-500">Percentage</div>
                  </CardHeader>
                </Card>
              </div>

              {/* Rank Prediction */}
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">All India Rank Prediction</h2>
                </CardHeader>
                <CardContent>
                  <div id="rank-prediction" className="text-2xl font-bold text-center my-2">
                    {parseFloat(results.percentage) > 80 ? "Top 5%" : 
                     parseFloat(results.percentage) > 60 ? "Top 20%" :
                     parseFloat(results.percentage) > 40 ? "Top 50%" : "Below 50%"}
                  </div>
                  <p id="rank-description" className="text-gray-600 text-center">
                    {parseFloat(results.percentage) > 80 ? "Excellent performance! You're predicted to rank in the top 5% of candidates." : 
                     parseFloat(results.percentage) > 60 ? "Good performance! You're predicted to rank in the top 20% of candidates." :
                     parseFloat(results.percentage) > 40 ? "Average performance. With more practice, you can improve your ranking." : 
                     "Below average performance. Focus on weak areas and practice more."}
                  </p>
                </CardContent>
              </Card>

              {/* SWOT Analysis */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">SWOT Analysis</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-green-200">
                    <CardHeader className="bg-green-50">
                      <h3 className="font-medium text-green-800">Strengths</h3>
                    </CardHeader>
                    <CardContent>
                      <ul id="strengths-list" className="list-disc pl-5 space-y-1">
                        {parseFloat(results.percentage) > 60 ? (
                          <>
                            <li>Strong conceptual understanding</li>
                            <li>Good time management</li>
                          </>
                        ) : (
                          <li>Basic understanding of core concepts</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardHeader className="bg-red-50">
                      <h3 className="font-medium text-red-800">Weaknesses</h3>
                    </CardHeader>
                    <CardContent>
                      <ul id="weaknesses-list" className="list-disc pl-5 space-y-1">
                        {results.incorrect > 0 && (
                          <li>Need to reduce incorrect answers</li>
                        )}
                        {results.unattempted > 0 && (
                          <li>Need to attempt more questions</li>
                        )}
                        <li>Requires more practice with {questions[currentQuestionIndex].section === 'a' ? 'MCQs' : questions[currentQuestionIndex].section === 'b' ? 'MSQs' : 'NATs'}</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-200">
                    <CardHeader className="bg-yellow-50">
                      <h3 className="font-medium text-yellow-800">Opportunities</h3>
                    </CardHeader>
                    <CardContent>
                      <ul id="opportunities-list" className="list-disc pl-5 space-y-1">
                        <li>Focus on high-weightage topics</li>
                        <li>Practice more {questions[currentQuestionIndex].section === 'a' ? 'MCQs' : questions[currentQuestionIndex].section === 'b' ? 'MSQs' : 'NATs'}</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200">
                    <CardHeader className="bg-orange-50">
                      <h3 className="font-medium text-orange-800">Threats</h3>
                    </CardHeader>
                    <CardContent>
                      <ul id="threats-list" className="list-disc pl-5 space-y-1">
                        <li>Negative marking for incorrect answers</li>
                        <li>Time pressure in exam</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Answers Container */}
              <div id="answers-container" className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Question-wise Analysis</h3>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={index} className={`${
                      selectedOptions[index] && 
                      JSON.stringify(selectedOptions[index]?.sort()) === JSON.stringify(question.correctAnswers?.sort()) 
                        ? 'border-green-200 bg-green-50' 
                        : selectedOptions[index] 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-gray-200'
                    }`}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Q{index + 1}: {question.text}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            selectedOptions[index] && 
                            JSON.stringify(selectedOptions[index]?.sort()) === JSON.stringify(question.correctAnswers?.sort()) 
                              ? 'bg-green-100 text-green-800' 
                              : selectedOptions[index] 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedOptions[index] ? 
                              (JSON.stringify(selectedOptions[index]?.sort()) === JSON.stringify(question.correctAnswers?.sort()) ? 
                                'Correct' : 'Incorrect') : 
                              'Unattempted'}
                          </span>
                        </div>
                      </CardHeader>
                      {question.type !== 'nat' && (
                        <CardContent>
                          <div className="space-y-2">
                            {question.options?.map((option, optIndex) => (
                              <div key={optIndex} className={`flex items-center space-x-2 ${
                                question.correctAnswers?.includes(optIndex) ? 'text-green-700' :
                                selectedOptions[index]?.includes(optIndex) ? 'text-red-700' : ''
                              }`}>
                                <div className={`h-4 w-4 rounded-full border ${
                                  question.correctAnswers?.includes(optIndex) ? 'bg-green-100 border-green-500' :
                                  selectedOptions[index]?.includes(optIndex) ? 'bg-red-100 border-red-500' : 'border-gray-300'
                                }`} />
                                <span>{option}</span>
                                {question.correctAnswers?.includes(optIndex) && (
                                  <span className="ml-2 text-xs text-green-600">(Correct)</span>
                                )}
                                {selectedOptions[index]?.includes(optIndex) && !question.correctAnswers?.includes(optIndex) && (
                                  <span className="ml-2 text-xs text-red-600">(Your selection)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBackToTest}>
                Back to Mock
              </Button>
              <Button disabled>
                Next Mock Test
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Calculator Modal */}
        {showCalculator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-80">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Scientific Calculator</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowCalculator(false)}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <input
                    type="text"
                    value={calculatorInput}
                    readOnly
                    className="w-full border rounded px-3 py-2 text-right font-mono"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['7', '8', '9', '/'].map((btn) => (
                    <Button key={btn} variant="outline" onClick={() => handleCalculatorInput(btn)}>
                      {btn}
                    </Button>
                  ))}
                  {['4', '5', '6', '*'].map((btn) => (
                    <Button key={btn} variant="outline" onClick={() => handleCalculatorInput(btn)}>
                      {btn}
                    </Button>
                  ))}
                  {['1', '2', '3', '-'].map((btn) => (
                    <Button key={btn} variant="outline" onClick={() => handleCalculatorInput(btn)}>
                      {btn}
                    </Button>
                  ))}
                  {['0', '.', '=', '+'].map((btn) => (
                    <Button 
                      key={btn} 
                      variant={btn === '=' ? 'default' : 'outline'} 
                      onClick={() => btn === '=' ? calculateResult() : handleCalculatorInput(btn)}
                    >
                      {btn}
                    </Button>
                  ))}
                  <Button 
                    variant="outline" 
                    className="col-span-2" 
                    onClick={clearCalculator}
                  >
                    Clear
                  </Button>
                  <Button 
                    variant="outline" 
                    className="col-span-2" 
                    onClick={() => setCalculatorInput(prev => prev.slice(0, -1))}
                  >
                    ⌫
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

     {/* Question Navigation */}
<div className="w-64 bg-white rounded-lg shadow p-4">
  <h2 className="font-bold mb-4">Question Navigation</h2>
  <div className="grid grid-cols-5 gap-2 mb-6" id="question-buttons">
    {questions.map((question, index) => (
      <Button
        key={index}
        variant={
          currentQuestionIndex === index ? 'default' : 
          selectedOptions[index] ? 'secondary' : 'outline'
        }
        size="sm"
        className={`h-8 ${
          selectedOptions[index] ? 
            (JSON.stringify(selectedOptions[index]?.sort()) === JSON.stringify(question.correctAnswers?.sort()) ? 
              'bg-green-100 text-green-800 hover:bg-green-100' : 
              'bg-red-100 text-red-800 hover:bg-red-100'
            ) : ''
        } ${
          currentQuestionIndex === index ? 
            question.section === 'a' ? 'bg-blue-100 text-blue-800' :
            question.section === 'b' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800' : ''
        }`}
        onClick={() => handleQuestionNavigation(index)}
      >
        {index + 1}
      </Button>
    ))}
  </div>

  <div className="space-y-2">
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={() => setShowCalculator(true)}
    >
      <Calculator className="h-4 w-4 mr-2" />
      Scientific Calculator
    </Button>
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={handleClearResponse}
      disabled={!selectedOptions[currentQuestionIndex]}
    >
      Clear Response
    </Button>
    <Button 
      className="w-full bg-red-600 hover:bg-red-700" 
      onClick={handleSubmitTest}
      disabled={testSubmitted}
    >
      {testSubmitted ? 'Test Submitted' : 'Submit Test'}
    </Button>
  </div>
</div>
</main>
)
}
