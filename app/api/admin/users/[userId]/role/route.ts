import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"
import { handleAuthError } from "@/lib/roleAuth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await adminAuth()
    const resolvedParams = await params

    const { role } = await request.json()
    const roleDefinition = typeof role === "string"
      ? await prisma.roleDefinition.findUnique({ where: { key: role } })
      : null
    if (!role || (!["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role) && !roleDefinition)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: resolvedParams.userId },
      select: { clerkUserId: true, role: true, email: true },
    })
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

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

    let clerkSyncWarning: string | undefined

    // Keep Clerk metadata aligned with the database role used by server guards.
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const clerkHeaders = {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        }
        const metadataBody = JSON.stringify({ public_metadata: { role } })
        let clerkUserId = targetUser.clerkUserId
        let clerkResponse = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}/metadata`, {
          method: "PATCH",
          headers: clerkHeaders,
          body: metadataBody,
        })

        // A deleted/recreated Clerk account leaves the old ID in MongoDB.
        // Repair that link automatically when the email identifies one account.
        if (clerkResponse.status === 404 && targetUser.email) {
          const lookupResponse = await fetch(
            `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(targetUser.email)}`,
            { headers: clerkHeaders },
          )
          const matches = lookupResponse.ok ? await lookupResponse.json() : []
          if (Array.isArray(matches) && matches.length === 1 && matches[0]?.id) {
            clerkUserId = matches[0].id
            clerkResponse = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}/metadata`, {
              method: "PATCH",
              headers: clerkHeaders,
              body: metadataBody,
            })

            if (clerkResponse.ok && clerkUserId !== targetUser.clerkUserId) {
              await prisma.user.update({
                where: { id: resolvedParams.userId },
                data: { clerkUserId },
              })
            }
          }
        }

        if (clerkResponse.ok) {
          // Keep the database and Clerk metadata in sync before returning success.
        } else {
          const clerkError = await clerkResponse.text()
          console.error("Failed to sync role with Clerk metadata", {
            status: clerkResponse.status,
            clerkUserId,
            response: clerkError.slice(0, 500),
          })

          if (clerkResponse.status === 404) {
            clerkSyncWarning = "Database role updated, but this user has no matching Clerk account."
          } else {
            await prisma.user.update({ where: { id: resolvedParams.userId }, data: { role: targetUser.role } })
            return NextResponse.json({ error: "Role update was rolled back because Clerk sync failed" }, { status: 502 })
          }
        }
      } catch (syncError) {
        console.error("Failed to sync role with Clerk metadata", syncError)
        await prisma.user.update({ where: { id: resolvedParams.userId }, data: { role: targetUser.role } })
        return NextResponse.json({ error: "Role update was rolled back because Clerk sync failed" }, { status: 502 })
      }
    }

    return NextResponse.json({
      message: "User role updated successfully",
      user: updatedUser,
      ...(clerkSyncWarning ? { warning: clerkSyncWarning } : {}),
    })
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error("Error updating user role:", error)
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
