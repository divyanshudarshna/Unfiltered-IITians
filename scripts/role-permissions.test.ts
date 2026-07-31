import assert from "node:assert/strict"
import { canAccessApiPath } from "../lib/rolePermissions"

const instructor = {
  role: "INSTRUCTOR",
  permissions: ["mocks", "courses"] as const,
  readOnly: false,
  canDelete: false,
}

assert.equal(canAccessApiPath(instructor, "/api/admin/mocks/123", "GET"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/mocks/123", "DELETE"), false)
assert.equal(canAccessApiPath(instructor, "/api/admin/courses/123", "PUT"), true)
assert.equal(canAccessApiPath(instructor, "/api/admin/users", "GET"), false)
assert.equal(canAccessApiPath({ ...instructor, readOnly: true }, "/api/admin/courses/123", "PUT"), false)
assert.equal(canAccessApiPath({ ...instructor, canDelete: true }, "/api/admin/mocks/123", "DELETE"), true)
assert.equal(canAccessApiPath({ role: "ADMIN", permissions: [], readOnly: true, canDelete: false }, "/api/admin/users", "DELETE"), true)

console.log("role-permissions tests passed")
