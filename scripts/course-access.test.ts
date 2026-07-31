import assert from "node:assert/strict"
import {
  evaluateLectureAccess,
  getPreviewContentState,
  resolveCourseDeliveryMode,
  shapeLectureForAccess,
} from "../lib/courseAccessPolicy"
import { verifySecurityPassword } from "../lib/securityPassword"

assert.deepEqual(verifySecurityPassword(undefined, "anything"), {
  allowed: false,
  status: 500,
  error: "Security password is not configured",
})
assert.deepEqual(verifySecurityPassword("secret", ""), {
  allowed: false,
  status: 400,
  error: "Security password is required",
})
assert.deepEqual(verifySecurityPassword("secret", "wrong"), {
  allowed: false,
  status: 403,
  error: "Invalid security password",
})
assert.deepEqual(verifySecurityPassword("secret", "secret"), { allowed: true })

assert.equal(
  evaluateLectureAccess({
    courseStatus: "PUBLISHED",
    isFreePreview: true,
    hasFullAccess: false,
  }),
  "PREVIEW",
)
assert.equal(
  evaluateLectureAccess({
    courseStatus: "DRAFT",
    isFreePreview: true,
    hasFullAccess: false,
  }),
  "DENIED",
)
assert.equal(
  evaluateLectureAccess({
    courseStatus: "PUBLISHED",
    isFreePreview: false,
    hasFullAccess: false,
  }),
  "DENIED",
)
assert.equal(
  evaluateLectureAccess({
    courseStatus: "DRAFT",
    isFreePreview: false,
    hasFullAccess: true,
  }),
  "FULL",
)

assert.equal(
  getPreviewContentState({
    lectures: [{ locked: false }, { locked: true }],
    quizLocked: true,
  }),
  "MIXED",
)
assert.equal(
  getPreviewContentState({
    lectures: [{ locked: true }, { locked: true }],
    quizLocked: true,
  }),
  "LOCKED",
)
assert.equal(
  getPreviewContentState({
    lectures: [{ locked: false }, { locked: false }],
    quizLocked: false,
  }),
  "OPEN",
)

const paidLecture = shapeLectureForAccess({
  id: "paid-lecture",
  title: "Paid lesson",
  order: 2,
  isFreePreview: false,
  summary: "private summary",
  videoUrl: "https://example.com/private-video",
  youtubeEmbedUrl: "https://youtube.com/private",
  pdfUrl: "https://example.com/private.pdf",
  studyTips: ["private tip"],
}, false)
assert.deepEqual(paidLecture, {
  id: "paid-lecture",
  title: "Paid lesson",
  order: 2,
  isFreePreview: false,
  locked: true,
})

assert.equal(resolveCourseDeliveryMode({
  previewRequested: true,
  hasFullAccess: true,
  courseStatus: "PUBLISHED",
  hasFreePreview: true,
}), "PREVIEW")
assert.equal(resolveCourseDeliveryMode({
  previewRequested: false,
  hasFullAccess: true,
  courseStatus: "PUBLISHED",
  hasFreePreview: true,
}), "FULL")
assert.equal(resolveCourseDeliveryMode({
  previewRequested: true,
  hasFullAccess: true,
  courseStatus: "DRAFT",
  hasFreePreview: true,
}), "DENIED")
assert.equal(resolveCourseDeliveryMode({
  previewRequested: false,
  hasFullAccess: false,
  courseStatus: "PUBLISHED",
  hasFreePreview: true,
}), "DENIED")

console.log("course access tests passed")
