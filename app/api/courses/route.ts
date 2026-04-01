import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSet, CacheKeys } from "@/lib/cache";

// ✅ PHASE 2: Added Redis caching with 60s TTL
// ✅ OPTIMIZED: Uses new indexes on status + order for faster queries
export async function GET() {
  try {
    const cacheKey = CacheKeys.courses.list();

    // ✅ Try to get from cache first, fallback to database
    const courses = await getOrSet(
      cacheKey,
      async () => {
        return await prisma.course.findMany({
          where: { status: "PUBLISHED" },
          orderBy: [
            { order: "asc" },
            { createdAt: "desc" }
          ],
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            actualPrice: true,
            durationMonths: true,
            order: true,
            courseType: true,
            // ✅ PERFORMANCE: Only select needed fields to reduce payload size
          },
        });
      },
      60 // ✅ Cache for 60 seconds
    );

    // ✅ PERFORMANCE: Response will be cached by Redis
    return NextResponse.json(courses, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    });
  } catch (err) {
    console.error("❌ Courses list error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
