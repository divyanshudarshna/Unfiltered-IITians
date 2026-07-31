// app/api/admin/courses/reorder/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

interface CourseOrderUpdate {
  id: string;
  order: number;
}

// ================== BULK UPDATE COURSE ORDER ==================
export async function PUT(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);
    const body = await req.json();
    const { courseOrders }: { courseOrders: CourseOrderUpdate[] } = body;

    if (!courseOrders || !Array.isArray(courseOrders)) {
      return NextResponse.json({ error: "Invalid course orders data" }, { status: 400 });
    }

    // Use transaction to update all courses atomically
    const updatePromises = courseOrders.map(({ id, order }) =>
      prisma.course.update({
        where: { id },
        data: { order },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Course orders updated successfully" });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("❌ Bulk Update Course Order Error:", err);
    return NextResponse.json({ error: "Failed to update course orders" }, { status: 500 });
  }
}
