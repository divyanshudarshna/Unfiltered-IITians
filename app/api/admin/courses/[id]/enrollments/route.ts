// api/admin/courses/[id]/enrollments/route.ts
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

    // Get course to calculate expiry date
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: { durationMonths: true }
    });
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Calculate expiry date based on course duration
    const expiresAt = new Date(Date.now() + (course.durationMonths * 30 * 24 * 60 * 60 * 1000)); // months to milliseconds

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: params.id,
        expiresAt,
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
