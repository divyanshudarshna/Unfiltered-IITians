import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id }, // Prisma stores id as string already
      include: {
        details: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!course) {
      console.error("❌ No course found for id:", id);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("❌ Error fetching course details:", error);
    return NextResponse.json({ error: "Failed to fetch course details" }, { status: 500 });
  }
}
