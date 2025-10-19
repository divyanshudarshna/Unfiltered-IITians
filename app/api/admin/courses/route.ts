// app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ================== CREATE COURSE ==================
export async function POST(req: Request) {
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
      inclusions // ✅ NEW: Array of inclusions { type, id }
    } = body;

    if (!title || !price || !durationMonths) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If order not provided, set to next available order
    let courseOrder = order;
    if (!courseOrder) {
      const lastCourse = await prisma.course.findFirst({
        orderBy: { order: "desc" },
        select: { order: true }
      });
      courseOrder = (lastCourse?.order || 0) + 1;
    }

    // Use transaction to create course and inclusions together
    const result = await prisma.$transaction(async (tx) => {
      // Create the course
      const course = await tx.course.create({
        data: {
          title,
          description,
          price,
          actualPrice,
          durationMonths,
          status: status || "DRAFT",
          order: courseOrder,
        },
      });

      // Create inclusions if provided
      if (inclusions && Array.isArray(inclusions) && inclusions.length > 0) {
        const inclusionData = inclusions.map((inclusion: any) => ({
          courseId: course.id,
          inclusionType: inclusion.type, // 'MOCK_TEST', 'MOCK_BUNDLE', or 'SESSION'
          inclusionId: inclusion.id,
        }));

        await tx.courseInclusion.createMany({
          data: inclusionData,
        });
      }

      // Return course with inclusions
      return await tx.course.findUnique({
        where: { id: course.id },
        include: {
          inclusions: true,
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("❌ Create Course Error:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}

// ================== LIST COURSES ==================
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        contents: true,
        coupons: true,
        inclusions: true, // ✅ Re-enabled after DB migration
        enrollments: true,
        subscriptions: true,
       
      },

      orderBy: [
        { order: "asc" },
        { createdAt: "desc" }
      ],
    });

    return NextResponse.json(courses);
  } catch (err) {
    console.error("❌ List Courses Error:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
