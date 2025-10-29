import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const { lectureOrders } = await req.json();

    if (!Array.isArray(lectureOrders)) {
      return NextResponse.json(
        { error: "lectureOrders must be an array" },
        { status: 400 }
      );
    }

    // Update all lecture orders in a transaction
    await prisma.$transaction(
      lectureOrders.map((item: { id: string; order: number }) =>
        prisma.lecture.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Reorder Lectures Error:", err);
    return NextResponse.json(
      { error: "Failed to reorder lectures" },
      { status: 500 }
    );
  }
}
