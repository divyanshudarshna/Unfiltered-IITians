// Centralized role-based configuration for admin UI and APIs
export const ROLE = {
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  STUDENT: "STUDENT",
} as const

// Admin UI prefixes that an INSTRUCTOR may access
export const INSTRUCTOR_ALLOWED_ADMIN_PREFIXES: string[] = [
  "/admin/mocks",
  "/admin/mockBundles",
  "/admin/courses",
  "/admin/course-details",
  "/admin/course-enrollments",
  "/admin/announcement",
  "/admin/feedbacks",
  "/admin/contact-us", // ✅ Allow instructors to view/reply to contact messages
]

// Admin API prefixes that an INSTRUCTOR may access
export const INSTRUCTOR_ALLOWED_API_PREFIXES: string[] = [
  "/api/admin/mocks",
  "/api/admin/mockBundle",
  "/api/admin/courses",
  "/api/admin/course-details",
  "/api/admin/course-enrollments",
  "/api/admin/announcement",
  "/api/admin/feedback",
  "/api/admin/notifications",
  "/api/admin/contact-us",
]

// Explicit forbidden actions for INSTRUCTOR role (server-enforced)
// Example: prevent instructors from deleting courses
export const INSTRUCTOR_FORBIDDEN = {
  courses: {
    DELETE: true,
  },
  mocks: {
    DELETE: true,
  },
  mockBundle: {
    DELETE: true,
  },
}

// Easy future edits: modify the arrays above to change access for INSTRUCTORS
