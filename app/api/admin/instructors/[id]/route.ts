import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/admin/instructors/[id]
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, "GET");
    const { id } = await params;

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        courseInstructors: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            courseId: true,
            order: true,
            course: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    if (!instructor) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    return NextResponse.json(instructor);
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ GET /api/admin/instructors/[id]:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/admin/instructors/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, "PUT");
    const { id } = await params;

    const body = await req.json();
    const {
      fullName,
      email,
      title,
      bio,
      profileImageUrl,
      academicAffiliations,
      researchAppointments,
      expertiseAreas,
      awards,
      socialLinks,
      isActive,
      order,
    } = body;

    if (fullName !== undefined && !fullName?.trim()) {
      return NextResponse.json({ error: "fullName cannot be empty" }, { status: 400 });
    }

    const updated = await prisma.instructor.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName: fullName.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(title !== undefined && { title: title?.trim() || null }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(profileImageUrl !== undefined && { profileImageUrl: profileImageUrl?.trim() || null }),
        ...(academicAffiliations !== undefined && { academicAffiliations }),
        ...(researchAppointments !== undefined && { researchAppointments }),
        ...(expertiseAreas !== undefined && { expertiseAreas }),
        ...(awards !== undefined && { awards: awards?.trim() || null }),
        ...(socialLinks !== undefined && { socialLinks }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ PUT /api/admin/instructors/[id]:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/instructors/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, "DELETE");
    const { id } = await params;

    // CourseInstructor rows cascade-delete via Prisma schema (onDelete: Cascade)
    await prisma.instructor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ DELETE /api/admin/instructors/[id]:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
