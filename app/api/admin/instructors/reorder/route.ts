import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

// PUT /api/admin/instructors/reorder — bulk-update instructor display order
export async function PUT(req: NextRequest) {
  try {
    await assertAdminApiAccess(req.url, "PUT");

    const { instructorOrders } = await req.json();

    if (!Array.isArray(instructorOrders)) {
      return NextResponse.json(
        { error: "instructorOrders must be an array" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      instructorOrders.map((item: { id: string; order: number }) =>
        prisma.instructor.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const authRes = handleAuthError(err);
    if (authRes) return authRes;
    console.error("❌ Reorder Instructors Error:", err);
    return NextResponse.json({ error: "Failed to reorder instructors" }, { status: 500 });
  }
}
