import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, summary: true, pdfUrl: true, videoUrl: true },
    });

    if (!lecture) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    return NextResponse.json(lecture);
  } catch (err) {
    console.error("❌ Get lecture error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
