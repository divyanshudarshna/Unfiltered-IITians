import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET course details for a specific course
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const details = await prisma.courseDetail.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(details);
  } catch (error) {
    console.error("❌ Failed to fetch course details:", error);
    return NextResponse.json({ error: "Failed to fetch course details" }, { status: 500 });
  }
}

// CREATE a new course detail
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, courseId } = body;

    if (!courseId || !title) {
      return NextResponse.json({ error: "courseId and title are required" }, { status: 400 });
    }

    const detail = await prisma.courseDetail.create({
      data: { title, description, courseId },
    });

    return NextResponse.json(detail);
  } catch (error) {
    console.error("❌ Failed to create course detail:", error);
    return NextResponse.json({ error: "Failed to create course detail" }, { status: 500 });
  }
}
