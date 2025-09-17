import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/youtube/category
export async function POST(req: Request) {
  const body = await req.json();
  const { name, desc } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const category = await prisma.youtubeCategory.create({
    data: { name, desc },
  });

  return NextResponse.json(category, { status: 201 });
}

// GET /api/admin/youtube/category
export async function GET() {
  const categories = await prisma.youtubeCategory.findMany({
    include: { videos: true },
  });

  return NextResponse.json(categories);
}
