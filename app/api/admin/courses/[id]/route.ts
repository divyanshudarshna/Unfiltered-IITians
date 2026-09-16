// app/api/admin/courses/[id]/route.ts
import { NextResponse } from "next/server";
import { InclusionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { verifySecurityPassword } from "@/lib/securityPassword";
import { CacheKeys, invalidateCache } from "@/lib/cache";
import {
  CourseBillingInputError,
  hasCourseBillingInput,
  isSameCourseBillingPlan,
  normalizeCourseBillingInput,
  type CourseBillingConfig,
} from "@/lib/course-billing";

interface Params {
  params: Promise<{ id: string }>;
}

interface CourseInclusionInput {
  type?: unknown;
  id?: unknown;
}

// ================== GET SINGLE COURSE ==================
export async function GET(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        contents: { include: { lectures: true, quiz: true } },
        coupons: true,
        enrollments: true,
        subscriptions: true,
        inclusions: true, // ✅ Re-enabled after DB migration
        billingPlans: { orderBy: { version: "desc" } },
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    return NextResponse.json(course);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Fetch Course Error:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// ================== UPDATE COURSE ==================
export async function PUT(req: Request, { params }: Params) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;
    // Validate ObjectId format first
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 });
    }

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
       inclusions, // ✅ NEW: Handle inclusions in updates
     } = body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!Number.isInteger(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: "Price must be a non-negative whole number" }, { status: 400 });
    }

    if (!Number.isInteger(Number(durationMonths)) || Number(durationMonths) < 1) {
      return NextResponse.json({ error: "Duration must be a positive whole number" }, { status: 400 });
    }

    if (actualPrice !== null && actualPrice !== undefined && actualPrice !== "" &&
      (!Number.isInteger(Number(actualPrice)) || Number(actualPrice) < 0)) {
      return NextResponse.json({ error: "Discounted price must be a non-negative whole number" }, { status: 400 });
    }

    if (order !== null && order !== undefined && order !== "" &&
      (!Number.isInteger(Number(order)) || Number(order) < 1)) {
      return NextResponse.json({ error: "Order must be a positive whole number" }, { status: 400 });
    }

    // ✅ Validate status - ensure it's a valid PublishStatus enum value
    const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid course status" }, { status: 400 });
    }

    // ✅ Validate courseType - ensure it's a valid CourseType enum value
    const validCourseTypes = ['COMPETITIVE', 'SKILLS', 'WORKSHOP'];
    const validCourseType = courseType && validCourseTypes.includes(courseType) ? courseType : undefined;

    // Validate course exists first
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const billing: CourseBillingConfig | null = hasCourseBillingInput(body)
      ? normalizeCourseBillingInput(body)
      : null;

    // Use transaction to update course and inclusions together
    const result = await prisma.$transaction(async (tx) => {
      const latestPlan = await tx.courseBillingPlan.findFirst({
        where: { courseId: id },
        orderBy: { version: "desc" },
      });
      const effectiveBilling = billing ?? {
        billingMode: existingCourse.billingMode,
        subscriptionEnabled: existingCourse.subscriptionEnabled,
        amountPaise: latestPlan?.amountPaise ?? null,
        interval: (latestPlan?.interval ?? "monthly") as "monthly",
        totalCount: latestPlan?.totalCount ?? 120,
      };

      // Update the course
      await tx.course.update({
          where: { id },
        data: { 
          title: title?.trim(), 
          description: description?.trim() || null, 
          price: Number(price), 
          actualPrice: actualPrice === null || actualPrice === undefined || actualPrice === "" ? null : Number(actualPrice),
           durationMonths: Number(durationMonths),
           status: status && validStatuses.includes(status) ? status : 'DRAFT', // ✅ Use validated status
           ...(validCourseType && { courseType: validCourseType }), // ✅ Only update if provided
           order: order ? Number(order) : undefined,
           billingMode: effectiveBilling.billingMode,
           subscriptionEnabled: effectiveBilling.subscriptionEnabled,
         },
       });

      // Handle inclusions if provided
      if (inclusions !== undefined && Array.isArray(inclusions)) {
        try {
          // Delete existing inclusions
          await tx.courseInclusion.deleteMany({
            where: { courseId: id }
          });

          // Create new inclusions if any
          if (inclusions.length > 0) {
            // Validate inclusion data
             const inclusionData = inclusions.map((inclusion: CourseInclusionInput, index: number) => {
               if (typeof inclusion.type !== "string" || typeof inclusion.id !== "string") {
                 throw new Error(`Invalid inclusion at index ${index}: missing type or id`);
               }

              if (!['MOCK_TEST', 'MOCK_BUNDLE', 'SESSION'].includes(inclusion.type)) {
                throw new Error(`Invalid inclusion type: ${inclusion.type}`);
              }

              // Validate ObjectId format for inclusion ID
              if (!/^[0-9a-fA-F]{24}$/.test(inclusion.id)) {
                throw new Error(`Invalid inclusion ID format at index ${index}: ${inclusion.id}`);
              }

              return {
                courseId: id,
                inclusionType: inclusion.type as InclusionType,
                inclusionId: inclusion.id,
              };
            });

            await tx.courseInclusion.createMany({
              data: inclusionData,
            });
          }
         } catch (inclusionError: unknown) {
           console.error("Inclusion processing error:", inclusionError);
           const message = inclusionError instanceof Error ? inclusionError.message : "Invalid inclusion";
           throw new Error(`Inclusion error: ${message}`);
          }
        }

         if (effectiveBilling.subscriptionEnabled && effectiveBilling.amountPaise !== null) {
           if (!latestPlan || !isSameCourseBillingPlan(latestPlan, effectiveBilling)) {
             await tx.courseBillingPlan.create({
               data: {
                  courseId: id,
                 version: (latestPlan?.version ?? 0) + 1,
                 status: "DRAFT",
                 amountPaise: effectiveBilling.amountPaise,
                 currency: "INR",
                 interval: effectiveBilling.interval,
                 totalCount: effectiveBilling.totalCount,
                 providerSyncState: "PENDING",
               },
             });
           }
         }

        // Return updated course with inclusions
       const finalCourse = await tx.course.findUnique({
          where: { id },
         include: {
           inclusions: true,
           billingPlans: { orderBy: { version: "desc" } },
         },
      });

      return finalCourse;
    });

    await Promise.all([
      invalidateCache(CacheKeys.courses.list()),
      invalidateCache(CacheKeys.courses.detail(id)),
    ]);
    return NextResponse.json(result);
   } catch (err: unknown) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    if (err instanceof CourseBillingInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Update Course Error:", err);
    
    return NextResponse.json({ 
      error: "Failed to update course",
     details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}

// ================== DELETE COURSE ==================
export async function DELETE(req: Request, { params }: Params) {
  try {
    // Enforce role based access: instructors cannot delete courses
    await assertAdminApiAccess(req.url, req.method);
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const passwordResult = verifySecurityPassword(
      process.env.SECURITY_PASSWORD,
      body.securityPassword,
    );
    if (!passwordResult.allowed) {
      return NextResponse.json(
        { error: passwordResult.error },
        { status: passwordResult.status },
      );
    }

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid course ID format" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await prisma.course.delete({ where: { id } });
    await Promise.all([
      invalidateCache(CacheKeys.courses.list()),
      invalidateCache(CacheKeys.courses.detail(id)),
    ]);
    return NextResponse.json({ success: true });
   } catch (err: unknown) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("Delete Course Error:", err);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
