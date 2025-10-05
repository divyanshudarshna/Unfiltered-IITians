// app/api/admin/courses/reorder/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CourseOrderUpdate {
  id: string;
  order: number;
}

// ================== BULK UPDATE COURSE ORDER ==================
export async function PUT(req: Request) {
  try {
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
    console.error("❌ Bulk Update Course Order Error:", err);
    return NextResponse.json({ error: "Failed to update course orders" }, { status: 500 });
  }
}