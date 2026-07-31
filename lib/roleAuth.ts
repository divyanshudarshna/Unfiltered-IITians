import { auth, currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { type PermissionKey } from "./roleConfig"
import { canAccessApiPath, getRoleAccess } from "./rolePermissions"
import { NextResponse } from "next/server"

// Custom error class for auth failures so catch blocks can detect them
export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "AuthError"
    this.status = status
  }
}

// Helper to handle AuthError in catch blocks - use in API route catch blocks
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof Response) {
    return new NextResponse(error.statusText || "Auth error", { status: error.status })
  }
  return null // not an auth error
}

export async function getDbUserFromClerk() {
  try {
    const { userId } = await auth()
    if (!userId) {
      console.warn('[roleAuth] auth() returned no userId - user not authenticated')
      return null
    }
    const dbUser = await prisma.user.findUnique({ where: { clerkUserId: userId } })
    if (dbUser) return dbUser

    // No DB record found — webhook likely missed. Auto-upsert from Clerk profile.
    console.warn(`[roleAuth] No DB user for Clerk userId: ${userId} — auto-syncing from Clerk`)
    const clerkUser = await currentUser()
    if (!clerkUser) return null

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""
    const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
    const role = (clerkUser.publicMetadata?.role as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT') || 'STUDENT'

    if (!email) {
      console.warn(`[roleAuth] Clerk user ${userId} has no email, cannot sync user record`)
      return null
    }

    // If user already exists by email, link that record to current Clerk user
    // instead of creating a duplicate that violates unique email constraint.
    const existingByEmail = await prisma.user.findUnique({ where: { email } })
    if (existingByEmail) {
      const linked = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkUserId: userId,
          email,
          name,
          profileImageUrl: clerkUser.imageUrl,
          // Preserve role already present in DB for existing accounts.
        },
      })
      return linked
    }

    const created = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email,
        name,
        profileImageUrl: clerkUser.imageUrl,
        role,
      },
    })

    return created
  } catch (error) {
    console.error('[roleAuth] Error in getDbUserFromClerk:', error)
    return null
  }
}

/**
 * Assert that caller can access an admin API route.
 * Allows ADMIN always. Allows INSTRUCTOR when the apiPath matches configured prefixes
 * and action is not forbidden (e.g., DELETE on courses).
 */
export async function assertAdminApiAccess(reqUrl: string, method: string, requiredPermission?: PermissionKey) {
  const url = new URL(reqUrl, "http://localhost")
  const apiPath = url.pathname

  const dbUser = await getDbUserFromClerk()
  if (!dbUser) throw new AuthError("Unauthorized", 401)

  const access = await getRoleAccess(dbUser.role)
  if (!canAccessApiPath(access, apiPath, method, requiredPermission)) throw new AuthError("Forbidden", 403)
  return dbUser
}

const roleAuth = {
  getDbUserFromClerk,
  assertAdminApiAccess,
  handleAuthError,
  AuthError,
}

export default roleAuth
