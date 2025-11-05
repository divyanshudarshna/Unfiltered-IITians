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

    // Get the current lecture to check if order is changing
    const currentLecture = await prisma.lecture.findUnique({
      where: { id: params.id }
    });

    if (!currentLecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    let finalOrder = order !== undefined && order !== null ? Number.parseInt(order.toString(), 10) : currentLecture.order;

    // If order is changing, handle reordering
    if (order !== undefined && order !== null && Number.parseInt(order.toString(), 10) !== currentLecture.order) {
      const newOrder = Number.parseInt(order.toString(), 10);
      const oldOrder = currentLecture.order;
      const contentId = currentLecture.contentId;

      // Get all lectures in this content (excluding current)
      const existingLectures = await prisma.lecture.findMany({
        where: { 
          contentId,
          id: { not: params.id }
        },
        orderBy: { order: 'asc' }
      });

      // Check if the new order conflicts with an existing lecture
      const conflictingLecture = existingLectures.find(l => l.order === newOrder);

      if (conflictingLecture) {
        // Shift lectures to make room for the new position
        if (newOrder < oldOrder) {
          // Moving up - shift lectures between newOrder and oldOrder down by 1
          await prisma.lecture.updateMany({
            where: {
              contentId,
              order: { gte: newOrder, lt: oldOrder },
              id: { not: params.id }
            },
            data: {
              order: { increment: 1 }
            }
          });
        } else {
          // Moving down - shift lectures between oldOrder and newOrder up by 1
          await prisma.lecture.updateMany({
            where: {
              contentId,
              order: { gt: oldOrder, lte: newOrder },
              id: { not: params.id }
            },
            data: {
              order: { decrement: 1 }
            }
          });
        }
      }

      finalOrder = newOrder;
    }

    const updated = await prisma.lecture.update({
      where: { id: params.id },
      data: { 
        title, 
        videoUrl, 
        youtubeEmbedUrl, 
        pdfUrl, 
        summary, 
        order: finalOrder 
      },
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
