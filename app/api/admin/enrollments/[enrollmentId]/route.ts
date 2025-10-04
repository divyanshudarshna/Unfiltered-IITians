import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Delete the enrollment
    await prisma.enrollment.delete({
      where: { id: params.enrollmentId }
    })

    return NextResponse.json({ message: "Enrollment deleted successfully" })
  } catch (error) {
    console.error("Error deleting enrollment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}