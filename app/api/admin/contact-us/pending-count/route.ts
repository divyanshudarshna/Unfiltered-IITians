import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Count pending contact messages
    const count = await prisma.contactUs.count({
      where: {
        status: "PENDING"
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching pending contact count:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending contact count" },
      { status: 500 }
    );
  }
}
