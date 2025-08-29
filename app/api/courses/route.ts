import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { price: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        actualPrice: true,
        durationMonths: true,
      },
    });

    return NextResponse.json(courses);
  } catch (err) {
    console.error("❌ Courses list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
