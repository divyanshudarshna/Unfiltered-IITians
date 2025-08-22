// app/api/courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, price, actualPrice, durationMonths } = body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price,
        actualPrice,
        durationMonths,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        contents: {
          include: {
            lectures: true,
            quiz: true,
          },
        },
        coupons: true,
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}