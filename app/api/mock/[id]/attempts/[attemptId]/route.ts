import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string; attemptId: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id, attemptId } = params;

    const attempt = await prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: { mockTest: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const attemptCount = await prisma.mockAttempt.count({
      where: {
        userId: attempt.userId,
        mockTestId: attempt.mockTestId,
      },
    });

    return NextResponse.json({ attempt, attemptCount });
  } catch (err) {
    console.error("❌ Mock attempt error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
