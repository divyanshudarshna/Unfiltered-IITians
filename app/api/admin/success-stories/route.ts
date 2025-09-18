import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { role: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [stories, total] = await Promise.all([
      prisma.studentSuccessStory.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.studentSuccessStory.count({ where }),
    ]);

    return NextResponse.json({ stories, total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const story = await prisma.studentSuccessStory.create({ data });
    return NextResponse.json(story);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
  }
}
