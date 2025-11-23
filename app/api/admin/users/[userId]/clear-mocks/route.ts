import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Check authentication
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get userId from params
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        name: true,
        email: true,
        _count: {
          select: {
            mockAttempts: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete all mock attempts for this user
    const result = await prisma.mockAttempt.deleteMany({
      where: {
        userId: userId
      }
    });

    console.log(`✅ Cleared ${result.count} mock attempt(s) for user ${user.name || user.email}`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${result.count} mock attempt(s)`,
      deletedCount: result.count,
      userName: user.name,
      userEmail: user.email
    });
  } catch (error) {
    console.error("Error clearing mock attempts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
