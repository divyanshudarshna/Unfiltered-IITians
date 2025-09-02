import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// In your API, the comparison should work now:
const areMSQAnswersEqual = (correctAnswer: string, userAnswer: string): boolean => {
  // Both parameters are now strings like "Solid;Liquid;Gas"
  const correctArray = correctAnswer.split(';').map(item => item.trim()).filter(item => item).sort();
  const userArray = userAnswer.split(';').map(item => item.trim()).filter(item => item).sort();
  
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
    questions.forEach((question: any) => {
      const qid = question.id; 
      const userAnswer = answers[qid];

      if (!userAnswer || userAnswer === "") {
        unansweredCount++;
        return;
      }

      let isCorrect = false;
      
      if (question.type === "MSQ") {
        // Use the enhanced MSQ comparison function
        isCorrect = areMSQAnswersEqual(question.answer, userAnswer);
      } else if (question.type === "NAT") {
        // For numerical answers
        const correctNum = parseFloat(question.answer.replace(/["']/g, ''));
        const userNum = parseFloat(userAnswer);
        isCorrect = !isNaN(correctNum) && !isNaN(userNum) && Math.abs(correctNum - userNum) < 0.001;
      } else if (question.type === "DESCRIPTIVE") {
        // For descriptive answers
        isCorrect = userAnswer.trim().length > 0;
      } else {
        // For MCQ and other types - remove quotes from correct answer for comparison
        const cleanedCorrect = question.answer.replace(/["']/g, '');
        isCorrect = userAnswer === cleanedCorrect;
      }

      if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const percentage = Math.round((correctCount / totalQuestionsCount) * 100);

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