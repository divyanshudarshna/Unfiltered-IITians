// app/api/success-stories/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const allStories = await prisma.studentSuccessStory.findMany({
      orderBy: { createdAt: "desc" },
    });

    const stories = allStories.filter((story) => {
      const status = String((story as { approvalStatus?: string | null }).approvalStatus ?? "").toLowerCase();
      const isApproved = (story as { isApproved?: boolean | null }).isApproved;

      if (status === "pending" || status === "rejected") return false;
      if (status === "approved") return true;

      // Legacy fallback: if status is missing/unknown, only hide when explicitly marked unapproved.
      return isApproved !== false;
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
