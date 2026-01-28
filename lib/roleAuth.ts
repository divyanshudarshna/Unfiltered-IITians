import { currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { INSTRUCTOR_ALLOWED_API_PREFIXES, INSTRUCTOR_FORBIDDEN, ROLE } from "./roleConfig"

function pathStartsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((p) => path.startsWith(p))
}

export async function getDbUserFromClerk() {
  const clerk = await currentUser()
  if (!clerk) return null
  const dbUser = await prisma.user.findUnique({ where: { clerkUserId: clerk.id } })
  return dbUser
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
  if (!dbUser) throw new Response("Unauthorized", { status: 401 })

  if (dbUser.role === ROLE.ADMIN) return dbUser

  if (dbUser.role === ROLE.INSTRUCTOR) {
    // Check if instructor is allowed for this API prefix
    if (!pathStartsWithAny(apiPath, INSTRUCTOR_ALLOWED_API_PREFIXES)) {
      throw new Response("Forbidden", { status: 403 })
    }

    // Extra rule: prevent instructors from deleting courses
    if (apiPath.startsWith("/api/admin/courses") && (method || "").toUpperCase() === "DELETE") {
      if (INSTRUCTOR_FORBIDDEN.courses.DELETE) {
        throw new Response("Forbidden", { status: 403 })
      }
    }

    // Extra rule: prevent instructors from deleting mocks
    if (apiPath.startsWith("/api/admin/mocks") && (method || "").toUpperCase() === "DELETE") {
      if (INSTRUCTOR_FORBIDDEN.mocks.DELETE) {
        throw new Response("Forbidden", { status: 403 })
      }
    }

    // Extra rule: prevent instructors from deleting mock bundles
    if (apiPath.startsWith("/api/admin/mockBundle") && (method || "").toUpperCase() === "DELETE") {
      if (INSTRUCTOR_FORBIDDEN.mockBundle.DELETE) {
        throw new Response("Forbidden", { status: 403 })
      }
    }

    return dbUser
  }

  throw new Response("Forbidden", { status: 403 })
}

export default {
  getDbUserFromClerk,
  assertAdminApiAccess,
}
