import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Questions array is required" }, 
        { status: 400 }
      );
    }

    // Find the mock
    const mock = await prisma.mockTest.findUnique({ 
      where: { id } 
    });
    
    if (!mock) {
      return NextResponse.json(
        { error: "Mock not found" }, 
        { status: 404 }
      );
    }

    // Get current questions
    const currentQuestions = Array.isArray(mock.questions) ? mock.questions : [];

    // Validate and prepare new questions
    const newQuestions = questions.map((question, index) => {
      // Basic validation
      if (!question.question || !question.type || !question.answer) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }

      // Validate question type
      const validTypes = ["MCQ", "MSQ", "DESCRIPTIVE", "NAT"];
      if (!validTypes.includes(question.type)) {
        throw new Error(
          `Question ${index + 1}: Invalid type '${question.type}'. Must be one of: ${validTypes.join(", ")}`
        );
      }

      // Validate options for MCQ/MSQ
      if ((question.type === "MCQ" || question.type === "MSQ") && 
          (!question.options || !Array.isArray(question.options) || question.options.length < 2)) {
        throw new Error(
          `Question ${index + 1}: MCQ/MSQ questions require at least 2 options`
        );
      }

      // Validate NAT answers are numerical
      if (question.type === "NAT") {
        const numAnswer = parseFloat(question.answer);
        if (isNaN(numAnswer)) {
          throw new Error(
            `Question ${index + 1}: NAT questions require a numerical answer`
          );
        }
      }

      return {
        ...question,
        id: `temp-${Date.now()}-${index}`, // Temporary ID, will be replaced by database
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    // Combine existing questions with new ones
    const updatedQuestions = [...currentQuestions, ...newQuestions];

    // Update mock with new questions array
    const updatedMock = await prisma.mockTest.update({
      where: { id },
      data: { 
        questions: updatedQuestions,
        updatedAt: new Date()
      },
    });

    return NextResponse.json({
      success: true,
      count: newQuestions.length,
      questions: newQuestions,
      mock: updatedMock
    });

  } catch (err: any) {
    console.error("Bulk upload error:", err);
    
    if (err.message.includes("Question") && err.message.includes("Invalid") || 
        err.message.includes("required") || err.message.includes("numerical")) {
      return NextResponse.json(
        { error: err.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}