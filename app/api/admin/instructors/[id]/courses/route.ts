import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/admin/instructors/[id]/courses — list courses assigned to this instructor
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, "GET");
    const { id } = await params;

    const rows = await prisma.courseInstructor.findMany({
      where: { instructorId: id },
      orderBy: { order: "asc" },
      include: {
        course: { select: { id: true, title: true, status: true, price: true } },
      },
    });

    return NextResponse.json(rows);
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ GET /api/admin/instructors/[id]/courses:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/instructors/[id]/courses — assign course(s) to instructor
// body: { courseId: string, order?: number }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, "POST");
    const { id } = await params;
    const { courseId, order = 0 } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const row = await prisma.courseInstructor.upsert({
      where: {
        courseId_instructorId: { courseId, instructorId: id },
      },
      create: { courseId, instructorId: id, order },
      update: { order },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ POST /api/admin/instructors/[id]/courses:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/instructors/[id]/courses — remove a course assignment
// body: { courseId: string }
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, "DELETE");
    const { id } = await params;
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    await prisma.courseInstructor.delete({
      where: {
        courseId_instructorId: { courseId, instructorId: id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ DELETE /api/admin/instructors/[id]/courses:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
