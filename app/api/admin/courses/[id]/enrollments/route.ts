// api/admin/courses/[id]/enrollments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCourseExpiryDate } from "@/lib/course-expiry";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

interface Params {
  params: { id: string }; // courseId
}

// 📖 Get all enrollments for a course
export async function GET(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: id },
      include: { user: true, course: true },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json(enrollments);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Get Enrollments Error:", err);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}

// ➕ Manually enroll a user
export async function POST(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Get course to calculate expiry date
    const course = await prisma.course.findUnique({
      where: { id },
      select: { durationMonths: true }
    });
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Calculate expiry date based on course duration
    const expiresAt = getCourseExpiryDate(new Date(), course.durationMonths);

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: id,
        expiresAt,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Create Enrollment Error:", err);
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
  }
}

// ❌ Remove enrollment
export async function DELETE(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await req.json(); // enrollmentId

    if (!id) {
      return NextResponse.json({ error: "Enrollment ID required" }, { status: 400 });
    }

    await prisma.enrollment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Delete Enrollment Error:", err);
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
}
