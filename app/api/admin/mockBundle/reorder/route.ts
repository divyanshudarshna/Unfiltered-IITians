// app/api/admin/mockBundle/reorder/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface MockBundleOrderUpdate {
  id: string;
  order: number;
}

// ================== BULK UPDATE MOCK BUNDLE ORDER ==================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { mockBundleOrders }: { mockBundleOrders: MockBundleOrderUpdate[] } = body;

    if (!mockBundleOrders || !Array.isArray(mockBundleOrders)) {
      return NextResponse.json({ error: "Invalid mock bundle orders data" }, { status: 400 });
    }

    // Use transaction to update all mock bundles atomically
    const updatePromises = mockBundleOrders.map(({ id, order }) =>
      prisma.mockBundle.update({
        where: { id },
        data: { order },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Mock bundle orders updated successfully" });
  } catch (err) {
    console.error("❌ Bulk Update Mock Bundle Order Error:", err);
    return NextResponse.json({ error: "Failed to update mock bundle orders" }, { status: 500 });
  }
}