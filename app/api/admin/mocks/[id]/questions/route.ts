import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { question } = body;

    if (!question || !question.question) {
      return NextResponse.json({ error: "Question data is required" }, { status: 400 });
    }

    // Find the mock
    const mock = await prisma.mockTest.findUnique({ where: { id } });
    if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

    // Ensure questions array exists
    const questions = Array.isArray(mock.questions) ? mock.questions : [];

    // Create new question
    const newQuestion = { ...question, id: `q-${Date.now()}` };
    questions.push(newQuestion);

    // Update mock with new questions array
    const updatedMock = await prisma.mockTest.update({
      where: { id },
      data: { questions },
    });

    return NextResponse.json({ question: newQuestion, mock: updatedMock });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
