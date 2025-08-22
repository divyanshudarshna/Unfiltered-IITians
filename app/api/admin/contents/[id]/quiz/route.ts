import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string }; // contentId
}

// ➕ Create quiz
export async function POST(req: Request, { params }: Params) {
  try {
    const { questions } = await req.json();

    if (!questions) {
      return NextResponse.json({ error: "Questions are required" }, { status: 400 });
    }

    // Check if quiz already exists for this content
    const existing = await prisma.quiz.findUnique({
      where: { contentId: params.id },
    });

    if (existing) {
      return NextResponse.json({ error: "Quiz already exists for this content" }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        contentId: params.id,
        questions, // JSON { question, options, correctAnswer, explanation }
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (err) {
    console.error("❌ Create Quiz Error:", err);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}

// 📖 Get quiz
export async function GET(req: Request, { params }: Params) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { contentId: params.id },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (err) {
    console.error("❌ Get Quiz Error:", err);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

// ✏️ Update quiz
export async function PUT(req: Request, { params }: Params) {
  try {
    const { questions } = await req.json();

    const updated = await prisma.quiz.update({
      where: { contentId: params.id },
      data: { questions },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Update Quiz Error:", err);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}

// ❌ Delete quiz
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.quiz.delete({
      where: { contentId: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Quiz Error:", err);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
