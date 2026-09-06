// Stable permission definitions shared by the admin UI and API authorization.
export const ROLE = { ADMIN: "ADMIN", INSTRUCTOR: "INSTRUCTOR", STUDENT: "STUDENT" } as const

export const ADMIN_PERMISSION_DEFINITIONS = {
  dashboard: { label: "Dashboard", group: "General", routePrefixes: ["/admin/dashboard"], apiPrefixes: ["/api/admin/dashboard"] },
  users: { label: "Users", group: "General", routePrefixes: ["/admin/users"], apiPrefixes: ["/api/admin/users"] },
  transaction_stats: { label: "Transaction Stats", group: "General", routePrefixes: ["/admin/stats"], apiPrefixes: ["/api/admin/stats", "/api/admin/transaction"] },
  mocks: { label: "Manage Mocks", group: "Mocks", routePrefixes: ["/admin/mocks"], apiPrefixes: ["/api/admin/mocks"] },
  mock_bundles: { label: "Manage Mock Bundles", group: "Mocks", routePrefixes: ["/admin/mockBundles"], apiPrefixes: ["/api/admin/mockBundle"] },
  courses: { label: "Manage Courses", group: "Courses", routePrefixes: ["/admin/courses", "/admin/contents"], apiPrefixes: ["/api/admin/courses", "/api/admin/contents", "/api/admin/lectures"] },
  course_details: { label: "Manage Details", group: "Courses", routePrefixes: ["/admin/course-details"], apiPrefixes: ["/api/admin/course-details"] },
  course_enrollments: { label: "Course Enrollments", group: "Courses", routePrefixes: ["/admin/course-enrollments"], apiPrefixes: ["/api/admin/course-enrollments", "/api/admin/enrollments"] },
  announcements: { label: "Manage Announcements", group: "Courses", routePrefixes: ["/admin/announcement"], apiPrefixes: ["/api/admin/course-announcement", "/api/admin/announcement"] },
  feedbacks: { label: "Feedbacks", group: "Courses", routePrefixes: ["/admin/feedbacks"], apiPrefixes: ["/api/admin/feedback"] },
  instructors: { label: "Manage Instructors", group: "General", routePrefixes: ["/admin/instructors"], apiPrefixes: ["/api/admin/instructors"] },
  coupons: { label: "Coupons", group: "General", routePrefixes: ["/admin/coupons"], apiPrefixes: ["/api/admin/coupons", "/api/admin/general-coupons"] },
  materials: { label: "Free Materials", group: "General", routePrefixes: ["/admin/materials"], apiPrefixes: ["/api/admin/materials", "/api/admin/material-categories"] },
  success_stories: { label: "Success Stories", group: "General", routePrefixes: ["/admin/successStories"], apiPrefixes: ["/api/admin/success-stories"] },
  sessions: { label: "Manage Sessions", group: "Sessions", routePrefixes: ["/admin/sessions"], apiPrefixes: ["/api/admin/sessions"] },
  session_enrollments: { label: "Session Enrollments", group: "Sessions", routePrefixes: ["/admin/session-enrollments"], apiPrefixes: ["/api/admin/session-enrollments"] },
  session_testimonials: { label: "Session Testimonials", group: "Sessions", routePrefixes: ["/admin/sessions/testimonials"], apiPrefixes: ["/api/admin/session-testimonials"] },
  youtube: { label: "Manage YouTube", group: "General", routePrefixes: ["/admin/youtube"], apiPrefixes: ["/api/admin/youtube"] },
  testimonials: { label: "Testimonials", group: "General", routePrefixes: ["/admin/testimonials"], apiPrefixes: ["/api/admin/testimonials"] },
  contacts: { label: "Contacts", group: "General", routePrefixes: ["/admin/contact-us"], apiPrefixes: ["/api/admin/contact-us"] },
  newsletter: { label: "Newsletter", group: "General", routePrefixes: ["/admin/newsletter"], apiPrefixes: ["/api/admin/newsletter"] },
  faq: { label: "FAQ", group: "General", routePrefixes: ["/admin/faq"], apiPrefixes: ["/api/admin/faq"] },
  settings: { label: "Settings", group: "Settings", routePrefixes: ["/admin/settings"], apiPrefixes: ["/api/admin/settings"] },
} as const

export type PermissionKey = keyof typeof ADMIN_PERMISSION_DEFINITIONS
export const ALL_ADMIN_PERMISSIONS = Object.keys(ADMIN_PERMISSION_DEFINITIONS) as PermissionKey[]
export const ADMIN_PERMISSION_GROUPS = [
  { label: "General", permissions: ["dashboard", "users", "transaction_stats", "instructors", "coupons", "materials", "success_stories", "youtube", "testimonials", "contacts", "newsletter", "faq"] },
  { label: "Mocks", permissions: ["mocks", "mock_bundles"] },
  { label: "Courses", permissions: ["courses", "course_details", "course_enrollments", "announcements", "feedbacks"] },
  { label: "Sessions", permissions: ["sessions", "session_enrollments", "session_testimonials"] },
  { label: "Settings", permissions: ["settings"] },
] as const satisfies ReadonlyArray<{ label: string; permissions: readonly PermissionKey[] }>

export const DEFAULT_ROLE_ACCESS: Record<string, { permissions: PermissionKey[]; readOnly: boolean; canDelete: boolean }> = {
  ADMIN: { permissions: ALL_ADMIN_PERMISSIONS, readOnly: false, canDelete: true },
  INSTRUCTOR: { permissions: ["mocks", "mock_bundles", "courses", "course_details", "course_enrollments", "announcements", "feedbacks", "contacts"], readOnly: false, canDelete: false },
  STUDENT: { permissions: [], readOnly: true, canDelete: false },
}

export const INSTRUCTOR_ALLOWED_ADMIN_PREFIXES = DEFAULT_ROLE_ACCESS.INSTRUCTOR.permissions.flatMap((p) => [...ADMIN_PERMISSION_DEFINITIONS[p].routePrefixes])
export const INSTRUCTOR_ALLOWED_API_PREFIXES = DEFAULT_ROLE_ACCESS.INSTRUCTOR.permissions.flatMap((p) => [...ADMIN_PERMISSION_DEFINITIONS[p].apiPrefixes])
export const INSTRUCTOR_FORBIDDEN = { courses: { DELETE: true }, mocks: { DELETE: true }, mockBundle: { DELETE: true } }

export function getPermissionForPath(path: string, isApi = false): PermissionKey | null {
  for (const permission of ALL_ADMIN_PERMISSIONS) {
    const prefixes = isApi ? ADMIN_PERMISSION_DEFINITIONS[permission].apiPrefixes : ADMIN_PERMISSION_DEFINITIONS[permission].routePrefixes
    if (prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return permission
  }
  return null
}

export function hasPermission(permissions: readonly string[], permission: PermissionKey) {
  return permissions.includes(permission)
}
