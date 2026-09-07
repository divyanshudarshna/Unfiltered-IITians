import assert from "node:assert/strict"
import { canAccessApiPath } from "../lib/rolePermissions"
import { getPermissionForPath } from "../lib/roleConfig"

const instructor = {
  role: "INSTRUCTOR",
  permissions: ["mocks", "courses"] as const,
  readOnly: false,
  canDelete: false,
}

assert.equal(canAccessApiPath(instructor, "/api/admin/mocks/123", "GET"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/mocks/123", "DELETE"), false)
assert.equal(canAccessApiPath(instructor, "/api/admin/courses/123", "PUT"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/courses/123/contents", "POST"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/contents/content-123", "PUT"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/contents/content-123/quiz", "POST"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/contents/content-123/lectures", "GET"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/contents/reorder", "PUT"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/lectures/lecture-123", "PUT"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/lectures/reorder", "PUT"), true)
assert.equal(getPermissionForPath("/admin/courses/course-123/contents"), "courses")
assert.equal(getPermissionForPath("/admin/contents/content-123/quiz"), "courses")
assert.equal(getPermissionForPath("/admin/contents/content-123/lectures"), "courses")
assert.equal(canAccessApiPath(instructor, "/api/admin/users", "GET"), false)
assert.equal(canAccessApiPath({ role: "STUDENT", permissions: [], readOnly: true, canDelete: false }, "/api/admin/courses/course-123/contents", "GET"), false)
assert.equal(canAccessApiPath({ role: "STUDENT", permissions: [], readOnly: true, canDelete: false }, "/api/admin/contents/content-123/quiz", "GET"), false)
assert.equal(canAccessApiPath({ ...instructor, readOnly: true }, "/api/admin/courses/123", "PUT"), false)
assert.equal(canAccessApiPath(instructor, "/api/admin/contents/content-123/quiz", "DELETE"), false)
assert.equal(canAccessApiPath({ ...instructor, canDelete: true }, "/api/admin/mocks/123", "DELETE"), true)
assert.equal(canAccessApiPath({ role: "ADMIN", permissions: [], readOnly: true, canDelete: false }, "/api/admin/users", "DELETE"), true)

const testimonialManager = {
  role: "TESTIMONIAL_MANAGER",
  permissions: ["testimonials"] as const,
  readOnly: false,
  canDelete: true,
}

assert.equal(canAccessApiPath(testimonialManager, "/api/testimonials", "POST", "testimonials"), true)
assert.equal(canAccessApiPath(testimonialManager, "/api/testimonials/123", "PUT", "testimonials"), true)
assert.equal(canAccessApiPath({ ...testimonialManager, canDelete: false }, "/api/testimonials/123", "DELETE", "testimonials"), false)

console.log("role-permissions tests passed")
