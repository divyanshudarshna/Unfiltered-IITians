import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // ✅ Fetch all sessions without checking login
    const sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
    });

    // ✅ Map sessions for frontend
    const sessionsData = sessions.map((s) => ({
      id: s.id.toString(),
      title: s.title,
      description: s.description,
      content: s.content,
      price: s.price,
      discountedPrice: s.discountedPrice,
      maxEnrollment: s.maxEnrollment,
      type: s.type,
      duration: s.duration,
      expiryDate: s.expiryDate,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({ sessions: sessionsData }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions", details: error.message },
      { status: 500 }
    );
  }
}
