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
        inclusions: true, // ✅ Re-enabled after DB migration
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
    const { 
      title, 
      description, 
      price, 
      actualPrice, 
      durationMonths, 
      status, 
      order,
      inclusions // ✅ NEW: Handle inclusions in updates
    } = body;

    // Use transaction to update course and inclusions together
    const result = await prisma.$transaction(async (tx) => {
      // Update the course
      await tx.course.update({
        where: { id: params.id },
        data: { title, description, price, actualPrice, durationMonths, status, order },
      });

      // Handle inclusions if provided
      if (inclusions !== undefined && Array.isArray(inclusions)) {
        // Delete existing inclusions
        await tx.courseInclusion.deleteMany({
          where: { courseId: params.id }
        });

        // Create new inclusions if any
        if (inclusions.length > 0) {
          const inclusionData = inclusions.map((inclusion: any) => ({
            courseId: params.id,
            inclusionType: inclusion.type,
            inclusionId: inclusion.id,
          }));

          await tx.courseInclusion.createMany({
            data: inclusionData,
          });
        }
      }

      // Return updated course with inclusions
      return await tx.course.findUnique({
        where: { id: params.id },
        include: {
          inclusions: true,
        },
      });
    });

    return NextResponse.json(result);
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
