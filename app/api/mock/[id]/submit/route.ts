import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Enhanced MSQ answer comparison function
const areMSQAnswersEqual = (correctAnswer: string, userAnswer: string, questionOptions?: string[]): boolean => {
  // Clean and normalize both answers
  const cleanCorrect = correctAnswer.replace(/["']/g, '').trim();
  const cleanUser = userAnswer.replace(/["']/g, '').trim();
  
  // Function to normalize an answer item (convert letters to option text if needed)
  const normalizeItem = (item: string): string => {
    const trimmed = item.trim();
    // If it's a single letter and we have options, convert to option text
    if (trimmed.length === 1 && /[A-Z]/i.test(trimmed) && questionOptions) {
      const idx = trimmed.toUpperCase().charCodeAt(0) - 65;
      return questionOptions[idx] ?? trimmed;
    }
    return trimmed;
  };
  
  const correctArray = cleanCorrect.split(';')
    .map(normalizeItem)
    .filter(item => item !== '')
    .sort((a, b) => a.localeCompare(b));
  const userArray = cleanUser.split(';')
    .map(normalizeItem)
    .filter(item => item !== '')
    .sort((a, b) => a.localeCompare(b));
  
  return correctArray.length === userArray.length && 
         correctArray.every((item, index) => item === userArray[index]);
};
export async function POST(req: Request) {
  try {
    const { attemptId, answers } = await req.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch attempt and related mock test
    const attempt = await prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: { mockTest: { select: { questions: true } } },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Parse questions
    const questions = Array.isArray(attempt.mockTest.questions)
      ? attempt.mockTest.questions
      : JSON.parse(attempt.mockTest.questions as unknown as string);

    const totalQuestionsCount = questions.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    // Calculate results with proper MSQ comparison
    questions.forEach((question: { id: string; type: string; answer: string; options?: string[] }) => {
      const qid = question.id; 
      const userAnswer = answers[qid];

      if (!userAnswer || userAnswer === "") {
        unansweredCount++;
        return;
      }

      let isCorrect = false;
      
      if (question.type === "MSQ") {
        // Use the enhanced MSQ comparison function with options
        isCorrect = areMSQAnswersEqual(question.answer, userAnswer, question.options);
      } else if (question.type === "NAT") {
        // For numerical answers
        const cleanCorrect = question.answer.replace(/["']/g, '');
        const correctNum = parseFloat(cleanCorrect);
        const userNum = parseFloat(userAnswer);
        isCorrect = !isNaN(correctNum) && !isNaN(userNum) && Math.abs(correctNum - userNum) < 0.001;
      } else if (question.type === "DESCRIPTIVE") {
        // For descriptive answers - consider any non-empty answer as correct for now
        isCorrect = userAnswer.trim().length > 0;
      } else {
        // For MCQ and other types - handle both letter-based and text-based answers
        const cleanedCorrect = question.answer.replace(/["']/g, '');
        const cleanedUser = userAnswer.replace(/["']/g, '');
        
        // Direct comparison first
        if (cleanedUser === cleanedCorrect) {
          isCorrect = true;
        } else if (question.options && cleanedCorrect.length === 1 && /[A-Z]/i.test(cleanedCorrect)) {
          // If correct answer is a letter, convert to option text and compare
          const idx = cleanedCorrect.toUpperCase().charCodeAt(0) - 65;
          const correctOptionText = question.options[idx];
          isCorrect = cleanedUser === correctOptionText;
        } else if (question.options && cleanedUser.length === 1 && /[A-Z]/i.test(cleanedUser)) {
          // If user answer is a letter, convert to option text and compare
          const idx = cleanedUser.toUpperCase().charCodeAt(0) - 65;
          const userOptionText = question.options[idx];
          isCorrect = userOptionText === cleanedCorrect;
        }
      }

      if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const percentage = Math.round((correctCount / totalQuestionsCount) * 100);

    console.log("Submit API Debug:", {
      attemptId,
      totalQuestions: totalQuestionsCount,
      correctCount,
      incorrectCount,
      unansweredCount,
      percentage,
      answersCount: Object.keys(answers).length,
      sampleAnswers: Object.entries(answers).slice(0, 2)
    });

    // Update attempt with all metrics
    const updatedAttempt = await prisma.mockAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score: correctCount,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalQuestions: totalQuestionsCount,
        percentage,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      data: {
        score: updatedAttempt.score,
        correctCount: updatedAttempt.correctCount,
        incorrectCount: updatedAttempt.incorrectCount,
        unansweredCount: updatedAttempt.unansweredCount,
        totalQuestions: updatedAttempt.totalQuestions,
        percentage: updatedAttempt.percentage,
      }
    });

  } catch (error) {
    console.error("Error submitting test:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}