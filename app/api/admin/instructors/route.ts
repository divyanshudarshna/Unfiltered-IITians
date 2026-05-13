import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

// GET /api/admin/instructors — list all instructors
export async function GET(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, "GET");

    const instructors = await prisma.instructor.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        courseInstructors: {
          select: {
            courseId: true,
            order: true,
            course: { select: { id: true, title: true, status: true } },
          },
        },
      },
    });

    return NextResponse.json(instructors);
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ GET /api/admin/instructors:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/instructors — create instructor
export async function POST(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, "POST");

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

    if (!fullName?.trim()) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    const instructor = await prisma.instructor.create({
      data: {
        fullName: fullName.trim(),
        email: email?.trim() || null,
        title: title?.trim() || null,
        bio: bio?.trim() || null,
        profileImageUrl: profileImageUrl?.trim() || null,
        academicAffiliations: academicAffiliations ?? [],
        researchAppointments: researchAppointments ?? [],
        expertiseAreas: expertiseAreas ?? [],
        awards: awards?.trim() || null,
        socialLinks: socialLinks ?? null,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    });

    return NextResponse.json(instructor, { status: 201 });
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ POST /api/admin/instructors:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
