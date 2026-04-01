// app/api/my-courses/route.ts
// ✅ OPTIMIZED: Single query with strategic includes instead of N+1
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ PERFORMANCE: Uses new index on clerkUserId (unique)
    const user = await prisma.user.findUnique({ 
      where: { clerkUserId },
      select: { id: true } // ✅ Only select needed field
    });
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ OPTIMIZED: Single query with strategic select to reduce payload
    // Uses new composite index (userId, expiresAt) for faster queries
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      select: {
        enrolledAt: true,
        expiresAt: true,
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            durationMonths: true,
            courseType: true,
            status: true, // ✅ Added to check if course is still published
          }
        }
      },
      orderBy: { enrolledAt: "desc" },
    });

    // ✅ PERFORMANCE: Map only needed fields, reduce response size
    const courses = enrollments.map(e => ({
      id: e.course.id,
      title: e.course.title,
      description: e.course.description,
      price: e.course.price ?? 0,
      durationMonths: e.course.durationMonths ?? 0,
      enrolledAt: e.enrolledAt,
      expiresAt: e.expiresAt,
      courseType: e.course.courseType,
      isActive: e.course.status === 'PUBLISHED', // ✅ Added for UI
    }));

    return NextResponse.json(courses, {
      headers: {
        'Cache-Control': 'private, max-age=30', // ✅ Short cache for user-specific data
      }
    });
  } catch (e) {
    console.error("Error fetching my courses:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
