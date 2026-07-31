export type LectureAccess = "FULL" | "PREVIEW" | "DENIED"
export type PreviewContentState = "OPEN" | "MIXED" | "LOCKED"
export type CourseDeliveryMode = "FULL" | "PREVIEW" | "DENIED"

interface LectureAccessInput {
  courseStatus: string
  isFreePreview: boolean
  hasFullAccess: boolean
}

export function evaluateLectureAccess({
  courseStatus,
  isFreePreview,
  hasFullAccess,
}: LectureAccessInput): LectureAccess {
  if (hasFullAccess) return "FULL"
  if (courseStatus === "PUBLISHED" && isFreePreview) return "PREVIEW"
  return "DENIED"
}

interface CourseDeliveryInput {
  previewRequested: boolean
  hasFullAccess: boolean
  courseStatus: string
  hasFreePreview: boolean
}

export function resolveCourseDeliveryMode({
  previewRequested,
  hasFullAccess,
  courseStatus,
  hasFreePreview,
}: CourseDeliveryInput): CourseDeliveryMode {
  if (previewRequested) {
    return courseStatus === "PUBLISHED" && hasFreePreview ? "PREVIEW" : "DENIED"
  }
  return hasFullAccess ? "FULL" : "DENIED"
}

interface PreviewContentInput {
  lectures: Array<{ locked?: boolean }>
  quizLocked?: boolean
}

export function getPreviewContentState({
  lectures,
  quizLocked = false,
}: PreviewContentInput): PreviewContentState {
  const hasUnlockedLecture = lectures.some((lecture) => !lecture.locked)
  const hasLockedItem = quizLocked || lectures.some((lecture) => lecture.locked)

  if (hasLockedItem && !hasUnlockedLecture) return "LOCKED"
  if (hasLockedItem) return "MIXED"
  return "OPEN"
}

interface LectureDeliveryInput {
  id: string
  title: string
  order: number
  isFreePreview: boolean
  summary?: string | null
  videoUrl?: string | null
  youtubeEmbedUrl?: string | null
  pdfUrl?: string | null
  studyTips?: string[] | null
}

export function shapeLectureForAccess(
  lecture: LectureDeliveryInput,
  hasFullAccess: boolean,
) {
  const allowed = hasFullAccess || lecture.isFreePreview
  const outline = {
    id: lecture.id,
    title: lecture.title,
    order: lecture.order,
    isFreePreview: lecture.isFreePreview,
    locked: !allowed,
  }

  if (!allowed) return outline

  return {
    ...outline,
    summary: lecture.summary ?? "",
    videoUrl: lecture.videoUrl ?? "",
    youtubeEmbedUrl: lecture.youtubeEmbedUrl ?? "",
    pdfUrl: lecture.pdfUrl ?? "",
    studyTips: lecture.studyTips ?? [],
  }
}
