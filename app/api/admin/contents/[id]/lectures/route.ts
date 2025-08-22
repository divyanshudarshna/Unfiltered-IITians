import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string }; // contentId
}

// ➕ Create lecture
export async function POST(req: Request, { params }: Params) {
  try {
    const { title, videoUrl, pdfUrl, summary, order } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const lecture = await prisma.lecture.create({
      data: {
        title,
        videoUrl,
        pdfUrl,
        summary,
        order,
        contentId: params.id,
      },
    });

    return NextResponse.json(lecture, { status: 201 });
  } catch (err) {
    console.error("❌ Create Lecture Error:", err);
    return NextResponse.json({ error: "Failed to create lecture" }, { status: 500 });
  }
}

// 📖 List lectures for content
export async function GET(req: Request, { params }: Params) {
  try {
    const lectures = await prisma.lecture.findMany({
      where: { contentId: params.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(lectures);
  } catch (err) {
    console.error("❌ Get Lectures Error:", err);
    return NextResponse.json({ error: "Failed to fetch lectures" }, { status: 500 });
  }
}
