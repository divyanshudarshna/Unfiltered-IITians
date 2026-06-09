import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params
    const { id } = await context.params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        testimonials: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            youtubeUrl: true,
            youtubeVideoId: true,
            name: true,
            sessionAttended: true,
            description: true,
            rating: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
