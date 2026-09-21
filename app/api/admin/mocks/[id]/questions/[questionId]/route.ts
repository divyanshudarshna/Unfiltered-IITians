import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

type StoredQuestion = Prisma.JsonObject & { id: string };

function isStoredQuestion(value: unknown): value is StoredQuestion {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    "id" in value && typeof value.id === "string";
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id, questionId } = await params;
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Question data is required" }, { status: 400 });
    }
    const updatedQuestion = body as Prisma.JsonObject;

    const mock = await prisma.mockTest.findUnique({ where: { id } });
    if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });
    if (!Array.isArray(mock.questions)) {
      return NextResponse.json({ error: "Invalid questions data" }, { status: 409 });
    }

    let questions = mock.questions;
    
    questions = questions.map((q) => {
      if (isStoredQuestion(q) && q.id === questionId) {
        // Create updated question object
        const updated: StoredQuestion = { ...q, ...updatedQuestion, id: q.id };
        
        // Remove imageUrl if it's undefined, null, or empty string
        if (updatedQuestion.imageUrl === undefined || 
            updatedQuestion.imageUrl === null || 
            updatedQuestion.imageUrl === "") {
          delete updated["imageUrl"];
        }
        
        return updated;
      }
      return q;
    });

    const updatedMock = await prisma.mockTest.update({
      where: { id },
      data: { questions },
    });

    const question = questions.find((q) => isStoredQuestion(q) && q.id === questionId);
    return NextResponse.json({ question, mock: updatedMock });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error(err);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id, questionId } = await params;
    const mock = await prisma.mockTest.findUnique({ where: { id } });
    if (!mock) return NextResponse.json({ error: "Mock not found" }, { status: 404 });
    if (!Array.isArray(mock.questions)) {
      return NextResponse.json({ error: "Invalid questions data" }, { status: 409 });
    }

    const questions = mock.questions.filter(
      (question) => !isStoredQuestion(question) || question.id !== questionId,
    );

    await prisma.mockTest.update({
      where: { id },
      data: { questions },
    });

    return NextResponse.json({ message: "Question deleted" });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error(err);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
