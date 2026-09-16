// app/api/courses/batch-status/route.ts
// ✅ PHASE 2: Batch endpoint to eliminate waterfall requests
// Replaces multiple per-course API calls with single batched request
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCached, setCached, CacheKeys } from "@/lib/cache";
import { getCourseAccessStatus } from "@/lib/course-access-status";

type CachedCourseAccess = ReturnType<typeof getCourseAccessStatus> & {
  enrolledAt?: Date | string | null;
};

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    // ✅ Allow unauthenticated requests (return all courses with no enrollment status)
    const { courseIds } = await req.json();

    if (!Array.isArray(courseIds) || courseIds.length === 0 || courseIds.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "courseIds array is required" }, { status: 400 });
    }

    // ✅ If no user, return all courses as not enrolled
    if (!clerkUserId) {
      const result = Object.fromEntries(courseIds.map(courseId => [courseId, {
        courseId,
        isEnrolled: false,
        hasAccess: false,
        expiresAt: null,
      }]));
      return NextResponse.json(result);
    }

    // ✅ Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Try to get from cache first
    const cacheKey = CacheKeys.courses.batchStatus(user.id);
    let enrollmentMap = await getCached<Record<string, CachedCourseAccess>>(cacheKey);

    if (!enrollmentMap) {
      const now = new Date();
      // Query all access rows because this user-level cache is reused across course lists.
      const [enrollments, entitlements] = await Promise.all([
        prisma.enrollment.findMany({
          where: { userId: user.id },
          select: { courseId: true, expiresAt: true, enrolledAt: true },
        }),
        prisma.entitlement.findMany({
          where: {
            userId: user.id,
            resourceType: "COURSE",
            status: "ACTIVE",
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          },
          select: { resourceId: true, endsAt: true },
        }),
      ]);

      const entitlementEndsByCourse = new Map<string, Date | null>();
      for (const entitlement of entitlements) {
        const existing = entitlementEndsByCourse.get(entitlement.resourceId);
        if (existing === null || entitlement.endsAt === null) {
          entitlementEndsByCourse.set(entitlement.resourceId, null);
        } else if (!existing || entitlement.endsAt > existing) {
          entitlementEndsByCourse.set(entitlement.resourceId, entitlement.endsAt);
        }
      }

      // ✅ Create a map for O(1) lookups
      enrollmentMap = {};
      enrollments.forEach((enrollment) => {
        const access = getCourseAccessStatus({
          enrollmentExpiresAt: enrollment.expiresAt,
          entitlementEndsAt: entitlementEndsByCourse.get(enrollment.courseId),
          now,
        });
        enrollmentMap![enrollment.courseId] = {
          ...access,
          enrolledAt: enrollment.enrolledAt
        };
      });
      for (const [courseId, endsAt] of entitlementEndsByCourse) {
        if (enrollmentMap[courseId]) continue;
        enrollmentMap[courseId] = getCourseAccessStatus({ entitlementEndsAt: endsAt, now });
      }

      // ✅ Cache for 30 seconds (user-specific data, short TTL)
      await setCached(cacheKey, enrollmentMap, 30);
    }

    // ✅ Map results for requested courses
    const result = Object.fromEntries(courseIds.map(courseId => [courseId, {
      courseId,
      ...(enrollmentMap![courseId] || {
        isEnrolled: false,
        hasAccess: false,
        expiresAt: null,
        enrolledAt: null
      })
    }]));

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Short cache for user-specific data
      }
    });

  } catch (error) {
    console.error("❌ Batch status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
