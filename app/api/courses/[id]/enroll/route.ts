// app/api/courses/[id]/enroll/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function POST(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { userId } = body;

    // Check if user already enrolled
    const existing = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: params.id,
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already enrolled" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: params.id,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error enrolling user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
