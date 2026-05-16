import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { sendEmail } from "@/lib/email";

// POST /api/admin/instructors/[id]/approve
// Body: { courseIds: string[], approvalNotes?: string, action: "approve" | "reject" }
interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, "POST");

    const { id } = await params;
    const body = await req.json();
    const {
      action,
      courseIds = [],
      approvalNotes,
    }: {
      action: "approve" | "reject";
      courseIds: string[];
      approvalNotes?: string;
    } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    // ── Fetch instructor ─────────────────────────────────────────────────────
    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: { courseInstructors: true },
    });

    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    if (action === "reject") {
      const updated = await prisma.instructor.update({
        where: { id },
        data: {
          approvalStatus: "rejected",
          isApproved: false,
          isActive: false,
          approvalNotes: approvalNotes?.trim() || null,
        },
      });
      return NextResponse.json({ success: true, instructor: updated });
    }

    // ── APPROVE flow ─────────────────────────────────────────────────────────

    // 1. Validate courseIds exist
    if (courseIds.length > 0) {
      const courses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true },
      });
      if (courses.length !== courseIds.length) {
        return NextResponse.json({ error: "One or more course IDs are invalid" }, { status: 400 });
      }
    }

    // 2. Update instructor record
    const updatedInstructor = await prisma.instructor.update({
      where: { id },
      data: {
        approvalStatus: "approved",
        isApproved: true,
        isActive: true,
        approvedAt: new Date(),
        approvalNotes: approvalNotes?.trim() || null,
      },
    });

    // 3. Assign courses — clear existing, then add new (admin-controlled)
    if (courseIds.length > 0) {
      // Remove all existing course assignments for this instructor
      await prisma.courseInstructor.deleteMany({ where: { instructorId: id } });

      // Re-create with new courseIds
      await prisma.courseInstructor.createMany({
        data: courseIds.map((courseId, idx) => ({
          courseId,
          instructorId: id,
          order: idx,
        })),
      });
    }

    // 4. Fetch assigned course titles for the email
    const assignedCourses = courseIds.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { title: true },
        })
      : [];

    // 5. Send approval email to instructor (fire-and-forget, don't block response)
    if (instructor.email) {
      sendEmail({
        to: instructor.email,
        template: "instructor_approved",
        data: {
          instructorName: instructor.fullName,
          instructorEmail: instructor.email,
          instructorTitle: instructor.title ?? undefined,
          assignedCourses: assignedCourses.map((c) => c.title),
          approvalNotes: approvalNotes?.trim() || undefined,
        },
        source: "instructor_approval",
        sentBy: "Admin",
        metadata: { instructorId: id },
      }).catch((err) => console.error("Failed to send instructor approval email:", err));
    }

    return NextResponse.json({
      success: true,
      instructor: updatedInstructor,
      assignedCourseCount: courseIds.length,
    });
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ POST /api/admin/instructors/[id]/approve:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
