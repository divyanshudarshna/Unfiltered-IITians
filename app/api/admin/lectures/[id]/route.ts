import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string }; // lectureId
}

// ✅ Get single lecture
export async function GET(req: Request, { params }: Params) {
  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id: params.id },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    return NextResponse.json(lecture);
  } catch (err) {
    console.error("❌ Get Lecture Error:", err);
    return NextResponse.json({ error: "Failed to fetch lecture" }, { status: 500 });
  }
}

// ✏️ Update lecture
export async function PUT(req: Request, { params }: Params) {
  try {
    const { title, videoUrl, youtubeEmbedUrl, pdfUrl, summary, order } = await req.json();

    const updated = await prisma.lecture.update({
      where: { id: params.id },
      data: { title, videoUrl, youtubeEmbedUrl, pdfUrl, summary, order },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Update Lecture Error:", err);
    return NextResponse.json({ error: "Failed to update lecture" }, { status: 500 });
  }
}

// ❌ Delete lecture
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.lecture.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Lecture Error:", err);
    return NextResponse.json({ error: "Failed to delete lecture" }, { status: 500 });
  }
}
