import { prisma } from "@/lib/prisma"
import { evaluateLectureAccess } from "@/lib/courseAccessPolicy"
import { getRoleAccess } from "@/lib/rolePermissions"

export async function getCourseEntitlement(clerkUserId: string | null, courseId: string) {
  if (!clerkUserId) return { hasFullAccess: false, userId: null, role: null, accessSource: null, enrollmentExpiresAt: null }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, role: true },
  })
  if (!user) return { hasFullAccess: false, userId: null, role: null, accessSource: null, enrollmentExpiresAt: null }
  const roleAccess = await getRoleAccess(user.role)
  if (user.role === "ADMIN" || roleAccess.permissions.includes("courses")) {
    return { hasFullAccess: true, userId: user.id, role: user.role, accessSource: "role" as const, enrollmentExpiresAt: null }
  }

  const now = new Date()
  const [enrollment, commerceEntitlement] = await Promise.all([
    prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { enrolledAt: "desc" },
      select: { expiresAt: true },
    }),
    prisma.entitlement.findFirst({
      where: {
        userId: user.id,
        resourceType: "COURSE",
        resourceId: courseId,
        status: "ACTIVE",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { endsAt: "desc" },
      select: { endsAt: true },
    }),
  ])

  return {
    hasFullAccess: Boolean(enrollment || commerceEntitlement),
    userId: user.id,
    role: user.role,
    accessSource: enrollment ? "enrollment" as const : commerceEntitlement ? "commerce" as const : null,
    enrollmentExpiresAt: enrollment?.expiresAt ?? commerceEntitlement?.endsAt ?? null,
  }
}

export async function getLectureAccess(lectureId: string, clerkUserId: string | null) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: {
      content: { select: { course: { select: { id: true, status: true } } } },
    },
  })
  if (!lecture) return null

  const entitlement = await getCourseEntitlement(clerkUserId, lecture.content.course.id)
  const access = evaluateLectureAccess({
    courseStatus: lecture.content.course.status,
    isFreePreview: lecture.isFreePreview,
    hasFullAccess: entitlement.hasFullAccess,
  })

  return { lecture, entitlement, access }
}

export async function hasFullContentAccess(contentId: string, clerkUserId: string | null) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { courseId: true },
  })
  if (!content) return null
  const entitlement = await getCourseEntitlement(clerkUserId, content.courseId)
  return { content, entitlement }
}
