// app/api/courses/batch-status/route.ts
// ✅ PHASE 2: Batch endpoint to eliminate waterfall requests
// Replaces multiple per-course API calls with single batched request
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCached, setCached, CacheKeys } from "@/lib/cache";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    // ✅ Allow unauthenticated requests (return all courses with no enrollment status)
    const { courseIds } = await req.json();

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: "courseIds array is required" }, { status: 400 });
    }

    // ✅ If no user, return all courses as not enrolled
    if (!clerkUserId) {
      const result = courseIds.map(courseId => ({
        courseId,
        isEnrolled: false,
        hasAccess: false,
        expiresAt: null,
      }));
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
    let enrollmentMap = await getCached<Record<string, any>>(cacheKey);

    if (!enrollmentMap) {
      // ✅ Batch fetch all enrollments for this user
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: user.id,
          courseId: { in: courseIds }
        },
        select: {
          courseId: true,
          expiresAt: true,
          enrolledAt: true
        }
      });

      // ✅ Create a map for O(1) lookups
      enrollmentMap = {};
      enrollments.forEach(enrollment => {
        enrollmentMap![enrollment.courseId] = {
          isEnrolled: true,
          hasAccess: !enrollment.expiresAt || new Date(enrollment.expiresAt) > new Date(),
          expiresAt: enrollment.expiresAt,
          enrolledAt: enrollment.enrolledAt
        };
      });

      // ✅ Cache for 30 seconds (user-specific data, short TTL)
      await setCached(cacheKey, enrollmentMap, 30);
    }

    // ✅ Map results for requested courses
    const result = courseIds.map(courseId => ({
      courseId,
      ...(enrollmentMap![courseId] || {
        isEnrolled: false,
        hasAccess: false,
        expiresAt: null,
        enrolledAt: null
      })
    }));

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
