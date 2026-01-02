import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const { contentOrders } = await req.json();

    if (!Array.isArray(contentOrders)) {
      return NextResponse.json({ error: "contentOrders must be an array" }, { status: 400 });
    }

    await prisma.$transaction(
      contentOrders.map((item: { id: string; order: number }) =>
        prisma.content.update({ where: { id: item.id }, data: { order: item.order } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Reorder Contents Error:", err);
    return NextResponse.json({ error: "Failed to reorder contents" }, { status: 500 });
  }
}
