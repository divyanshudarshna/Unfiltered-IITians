import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { INSTRUCTOR_ALLOWED_API_PREFIXES, INSTRUCTOR_FORBIDDEN, ROLE } from "./roleConfig"
import { NextResponse } from "next/server"

function pathStartsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((p) => path.startsWith(p))
}

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
    if (!dbUser) {
      console.warn(`[roleAuth] No DB user found for Clerk userId: ${userId}`)
      return null
    }
    return dbUser
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
export async function assertAdminApiAccess(reqUrl: string, method: string) {
  const url = new URL(reqUrl, "http://localhost")
  const apiPath = url.pathname

  const dbUser = await getDbUserFromClerk()
  if (!dbUser) throw new AuthError("Unauthorized", 401)

  if (dbUser.role === ROLE.ADMIN) return dbUser

  if (dbUser.role === ROLE.INSTRUCTOR) {
    // Check if instructor is allowed for this API prefix
    if (!pathStartsWithAny(apiPath, INSTRUCTOR_ALLOWED_API_PREFIXES)) {
      throw new AuthError("Forbidden", 403)
    }

    // Extra rule: prevent instructors from deleting courses
    if (apiPath.startsWith("/api/admin/courses") && (method || "").toUpperCase() === "DELETE") {
      if (INSTRUCTOR_FORBIDDEN.courses.DELETE) {
        throw new AuthError("Forbidden", 403)
      }
    }

    // Extra rule: prevent instructors from deleting mocks
    if (apiPath.startsWith("/api/admin/mocks") && (method || "").toUpperCase() === "DELETE") {
      if (INSTRUCTOR_FORBIDDEN.mocks.DELETE) {
        throw new AuthError("Forbidden", 403)
      }
    }

    // Extra rule: prevent instructors from deleting mock bundles
    if (apiPath.startsWith("/api/admin/mockBundle") && (method || "").toUpperCase() === "DELETE") {
      if (INSTRUCTOR_FORBIDDEN.mockBundle.DELETE) {
        throw new AuthError("Forbidden", 403)
      }
    }

    return dbUser
  }

  throw new AuthError("Forbidden", 403)
}

export default {
  getDbUserFromClerk,
  assertAdminApiAccess,
  handleAuthError,
  AuthError,
}
