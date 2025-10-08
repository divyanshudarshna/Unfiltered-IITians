// app/api/admin/sessions/reorder/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SessionOrderUpdate {
  id: string;
  order: number;
}

// ================== BULK UPDATE SESSION ORDER ==================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { sessionOrders }: { sessionOrders: SessionOrderUpdate[] } = body;

    if (!sessionOrders || !Array.isArray(sessionOrders)) {
      return NextResponse.json({ error: "Invalid session orders data" }, { status: 400 });
    }

    // Use transaction to update all sessions atomically
    const updatePromises = sessionOrders.map(({ id, order }) =>
      prisma.session.update({
        where: { id },
        data: { order },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Session orders updated successfully" });
  } catch (err) {
    console.error("❌ Bulk Update Session Order Error:", err);
    return NextResponse.json({ error: "Failed to update session orders" }, { status: 500 });
  }
}