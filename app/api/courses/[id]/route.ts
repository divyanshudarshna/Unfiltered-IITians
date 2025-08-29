import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        contents: {
          orderBy: { order: "asc" },
          include: { lectures: { orderBy: { order: "asc" } }, quiz: true },
        },
        coupons: true,
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    return NextResponse.json(course);
  } catch (err) {
    console.error("❌ Course details error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
