import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string }; // contentId
}

// ➕ Create lecture
export async function POST(req: Request, { params }: Params) {
  try {
    const { id: contentId } = await params;
    const { title, videoUrl, youtubeEmbedUrl, pdfUrl, summary, order } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Get existing lectures for this content
    const existingLectures = await prisma.lecture.findMany({
      where: { contentId },
      orderBy: { order: 'asc' }
    });

    let finalOrder: number;

    if (order !== undefined && order !== null) {
      // User specified an order
      const requestedOrder = Number.parseInt(order.toString(), 10);
      
      // Check if the requested order conflicts with existing lectures
      const conflictingLecture = existingLectures.find(l => l.order === requestedOrder);
      
      if (conflictingLecture) {
        // Shift all lectures at or after this position forward by 1
        await prisma.lecture.updateMany({
          where: {
            contentId,
            order: { gte: requestedOrder }
          },
          data: {
            order: { increment: 1 }
          }
        });
      }
      
      finalOrder = requestedOrder;
    } else {
      // No order specified - assign to last position
      const maxOrder = existingLectures.length > 0 
        ? Math.max(...existingLectures.map(l => l.order))
        : 0;
      finalOrder = maxOrder + 1;
    }

    const lecture = await prisma.lecture.create({
      data: {
        title,
        videoUrl,
        youtubeEmbedUrl,
        pdfUrl,
        summary,
        order: finalOrder,
        contentId,
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
    const { id } = await params;
    const lectures = await prisma.lecture.findMany({
      where: { contentId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(lectures);
  } catch (err) {
    console.error("❌ Get Lectures Error:", err);
    return NextResponse.json({ error: "Failed to fetch lectures" }, { status: 500 });
  }
}
