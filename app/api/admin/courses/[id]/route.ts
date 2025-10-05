// app/api/admin/courses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string };
}

// ================== GET SINGLE COURSE ==================
export async function GET(req: Request, { params }: Params) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        contents: { include: { lectures: true, quiz: true } },
        coupons: true,
        enrollments: true,
        subscriptions: true,
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    return NextResponse.json(course);
  } catch (err) {
    console.error("❌ Fetch Course Error:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// ================== UPDATE COURSE ==================
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { title, description, price, actualPrice, durationMonths, status, order } = body;

    const updated = await prisma.course.update({
      where: { id: params.id },
      data: { title, description, price, actualPrice, durationMonths, status, order },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ Update Course Error:", err);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// ================== DELETE COURSE ==================
export async function DELETE(req: Request, { params }: Params) {
  try {
    await prisma.course.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Course Error:", err);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
