import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string }; // courseId
}

// ➕ Create content for a course
export async function POST(req: Request, { params }: Params) {
  try {
    const { title, description, order } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const content = await prisma.content.create({
      data: {
        title,
        description,
        order,
        courseId: params.id,
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (err) {
    console.error("❌ Create Content Error:", err);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }
}

// 📖 List contents of a course
export async function GET(req: Request, { params }: Params) {
  try {
    const contents = await prisma.content.findMany({
      where: { courseId: params.id },
      include: {
        lectures: true,
        quiz: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(contents);
  } catch (err) {
    console.error("❌ Get Contents Error:", err);
    return NextResponse.json({ error: "Failed to fetch contents" }, { status: 500 });
  }
}
