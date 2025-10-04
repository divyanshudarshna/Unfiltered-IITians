import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      totalUsers: userCount,
      sampleUsers: sampleUsers,
      message: userCount === 0 ? "No users found in database" : `Found ${userCount} users`
    });
  } catch (error) {
    console.error("Error checking users:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}