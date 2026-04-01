import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";
import { getOrSet, CacheKeys } from "@/lib/cache";

interface Params {
  params: { id: string };
}

// ✅ PHASE 2: Cache course details for 5 minutes
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid course id" }, { status: 400 });
    }

    const cacheKey = CacheKeys.courses.detail(id);

    // ✅ Cache course details for 5 minutes
    const course = await getOrSet(
      cacheKey,
      async () => {
        const courseData = await prisma.course.findUnique({
          where: { id },
          include: {
            details: {
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!courseData) {
          return null;
        }

        return courseData;
      },
      300 // ✅ 5 minutes cache
    );

    if (!course) {
      console.error("❌ No course found for id:", id);
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error("❌ Error fetching course details:", error);
    return NextResponse.json({ error: "Failed to fetch course details" }, { status: 500 });
  }
}
