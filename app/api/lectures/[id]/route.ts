import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getLectureAccess } from "@/lib/courseAccess";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    const result = await getLectureAccess(id, userId);
    if (!result) return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    if (result.access === "DENIED") {
      return NextResponse.json({ error: "This lecture requires course access" }, { status: 403 });
    }

    const { content, ...lecture } = result.lecture;
    return NextResponse.json({ ...lecture, access: result.access }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("❌ Get lecture error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
