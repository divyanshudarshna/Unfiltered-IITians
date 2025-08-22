import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 📖 Get all payments
export async function GET() {
  try {
    const payments = await prisma.subscription.findMany({
      include: {
        course: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (err) {
    console.error("❌ Get Payments Error:", err);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
