import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

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

    // If link is provided, convert it to proper embed URL
    let processedLink = link;
    if (link) {
      const embedUrl = getYouTubeEmbedUrl(link);
      if (!embedUrl) {
        return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
      }
      processedLink = embedUrl;
    }

    const video = await prisma.youtubeVideo.update({
      where: { id: params.id },
      data: { title, description, link: processedLink, categoryId },
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
