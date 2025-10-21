import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string; questionId: string } }) {
  try {
    const { id, questionId } = params;
    const updatedQuestion = await req.json();

    const mock = await prisma.mockTest.findUnique({ where: { id } });
    if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

    let questions = Array.isArray(mock.questions) ? mock.questions : [];
    
    questions = questions.map((q: any) => {
      if (q.id === questionId) {
        // Create updated question object
        const updated = { ...q, ...updatedQuestion };
        
        // Remove imageUrl if it's undefined, null, or empty string
        if (updatedQuestion.imageUrl === undefined || 
            updatedQuestion.imageUrl === null || 
            updatedQuestion.imageUrl === "") {
          delete updated.imageUrl;
        }
        
        return updated;
      }
      return q;
    });

    const updatedMock = await prisma.mockTest.update({
      where: { id },
      data: { questions },
    });

    const question = questions.find((q: any) => q.id === questionId);
    return NextResponse.json({ question, mock: updatedMock });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; questionId: string } }) {
  try {
    const { id, questionId } = params;
    const mock = await prisma.mockTest.findUnique({ where: { id } });
    if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });

    const questions = (mock.questions as any[]).filter((q) => q.id !== questionId);

    await prisma.mockTest.update({
      where: { id },
      data: { questions },
    });

    return NextResponse.json({ message: "Question deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
