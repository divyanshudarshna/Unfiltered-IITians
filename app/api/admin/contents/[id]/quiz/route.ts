import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

interface Params {
  params: { id: string }; // contentId
}

// ➕ Create quiz
export async function POST(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    const { questions } = await req.json();

    if (!questions) {
      return NextResponse.json({ error: "Questions are required" }, { status: 400 });
    }

    // Check if quiz already exists for this content
    const existing = await prisma.quiz.findUnique({
      where: { contentId: id },
    });

    if (existing) {
      return NextResponse.json({ error: "Quiz already exists for this content" }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        contentId: id,
        questions, // JSON { question, options, correctAnswer, explanation }
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Create Quiz Error:", err);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}

// 📖 Get quiz
export async function GET(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { contentId: id },
    });

    // Return null if quiz doesn't exist (it's a valid state, not an error)
    if (!quiz) {
      return NextResponse.json(null);
    }

    return NextResponse.json(quiz);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Get Quiz Error:", err);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

// ✏️ Update quiz
export async function PUT(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    const { questions } = await req.json();

    const updated = await prisma.quiz.update({
      where: { contentId: id },
      data: { questions },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Update Quiz Error:", err);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}

// ❌ Delete quiz
export async function DELETE(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    await prisma.quiz.delete({
      where: { contentId: id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Delete Quiz Error:", err);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
