// app/api/admin/courses/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        order: true,
        details: { select: { id: true } }, // count of course details
        actualPrice: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    const lightweight = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      status: course.status,
      createdAt: course.createdAt,
      price: course.actualPrice,
      detailsCount: course.details.length, // total details for the course
    }));

    return NextResponse.json(lightweight);
  } catch (err) {
    console.error("❌ List Courses Error:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
