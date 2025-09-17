import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CREATE Video
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, link, categoryId } = body;

    if (!title || !link || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const video = await prisma.youtubeVideo.create({
      data: { title, description, link, categoryId },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET All Videos
export async function GET() {
  try {
    const videos = await prisma.youtubeVideo.findMany({
      include: { category: true },
    });

    return NextResponse.json(videos);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
