import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { id: string }; // courseId
}

// 📖 Get all enrollments for a course
export async function GET(req: Request, { params }: Params) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: params.id },
      include: { user: true, course: true },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json(enrollments);
  } catch (err) {
    console.error("❌ Get Enrollments Error:", err);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}

// ➕ Manually enroll a user
export async function POST(req: Request, { params }: Params) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: params.id,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (err) {
    console.error("❌ Create Enrollment Error:", err);
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
  }
}

// ❌ Remove enrollment
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await req.json(); // enrollmentId

    if (!id) {
      return NextResponse.json({ error: "Enrollment ID required" }, { status: 400 });
    }

    await prisma.enrollment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete Enrollment Error:", err);
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
}
