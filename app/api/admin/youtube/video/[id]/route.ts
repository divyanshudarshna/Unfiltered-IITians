import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// GET One Video
export async function GET(req: Request, { params }: Params) {
  try {
    const video = await prisma.youtubeVideo.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json(video);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// UPDATE Video
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { title, description, link, categoryId } = body;

    const video = await prisma.youtubeVideo.update({
      where: { id: params.id },
      data: { title, description, link, categoryId },
    });

    return NextResponse.json(video);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE Video
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.youtubeVideo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Video deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
