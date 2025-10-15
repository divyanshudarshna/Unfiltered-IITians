import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Use adminAuth instead of manual auth check
    await adminAuth()
    const resolvedParams = await params

    const { role, password } = await request.json()
    
    // Validate hardcoded password
    if (password !== "RAJ64") {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 })
    }
    
    if (!role || !["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: "User role updated successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}