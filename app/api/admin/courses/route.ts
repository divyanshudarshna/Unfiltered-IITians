// app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import { InclusionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { CourseBillingInputError, normalizeCourseBillingInput } from "@/lib/course-billing";

// ================== CREATE COURSE ==================
export async function POST(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const body = await req.json();
    const { 
      title, 
      description, 
      price, 
      actualPrice, 
      durationMonths, 
      status, 
      courseType, // Course type for certificate eligibility
      order,
      inclusions, // ✅ NEW: Array of inclusions { type, id }
     } = body;

    if (!title || !price || !durationMonths) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const billing = normalizeCourseBillingInput(body);

    // Validate courseType
    const validCourseTypes = ['COMPETITIVE', 'SKILLS', 'WORKSHOP'];
    const validatedCourseType = courseType && validCourseTypes.includes(courseType) ? courseType : 'COMPETITIVE';

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
          courseType: validatedCourseType,
          order: courseOrder,
          billingMode: billing.billingMode,
          subscriptionEnabled: billing.subscriptionEnabled,
        },
      });

      // Create inclusions if provided
      if (inclusions && Array.isArray(inclusions) && inclusions.length > 0) {
        const inclusionData = inclusions.map((inclusion: { type: string; id: string }) => ({
          courseId: course.id,
          inclusionType: inclusion.type as InclusionType, // 'MOCK_TEST', 'MOCK_BUNDLE', or 'SESSION'
          inclusionId: inclusion.id,
        }));

        await tx.courseInclusion.createMany({
          data: inclusionData,
        });
      }

      if (billing.subscriptionEnabled && billing.amountPaise !== null) {
        await tx.courseBillingPlan.create({
          data: {
            courseId: course.id,
            version: 1,
            status: "DRAFT",
            amountPaise: billing.amountPaise,
            currency: "INR",
            interval: billing.interval,
            totalCount: billing.totalCount,
            providerSyncState: "PENDING",
          },
        });
      }

      // Return course with inclusions
      return await tx.course.findUnique({
        where: { id: course.id },
        include: {
          inclusions: true,
          billingPlans: { orderBy: { version: "desc" } },
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    if (err instanceof CourseBillingInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("❌ Create Course Error:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}

// ================== LIST COURSES ==================
export async function GET(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const courses = await prisma.course.findMany({
      include: {
        contents: true,
        coupons: true,
        inclusions: true, // ✅ Re-enabled after DB migration
        enrollments: true,
        subscriptions: true,
        billingPlans: { orderBy: { version: "desc" } },
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
