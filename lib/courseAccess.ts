import { prisma } from "@/lib/prisma"
import { evaluateLectureAccess } from "@/lib/courseAccessPolicy"

export async function getCourseEntitlement(clerkUserId: string | null, courseId: string) {
  if (!clerkUserId) return { hasFullAccess: false, userId: null, role: null }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, role: true },
  })
  if (!user) return { hasFullAccess: false, userId: null, role: null }
  if (user.role === "ADMIN") {
    return { hasFullAccess: true, userId: user.id, role: user.role }
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      courseId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { enrolledAt: "desc" },
    select: { expiresAt: true },
  })

  return {
    hasFullAccess: Boolean(enrollment),
    userId: user.id,
    role: user.role,
    enrollmentExpiresAt: enrollment?.expiresAt ?? null,
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
