import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await assertAdminApiAccess(req.url, req.method);

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

    

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${result.count} mock attempt(s)`,
      deletedCount: result.count,
      userName: user.name,
      userEmail: user.email
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error clearing mock attempts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
