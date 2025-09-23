// app/api/success-stories/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const stories = await prisma.studentSuccessStory.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(stories, { status: 200 });
  } catch (error) {
    console.error("Error fetching success stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch success stories" },
      { status: 500 }
    );
  }
}
