import prisma from "@/lib/prisma"
import {
  ADMIN_PERMISSION_DEFINITIONS,
  ALL_ADMIN_PERMISSIONS,
  DEFAULT_ROLE_ACCESS,
  type PermissionKey,
  getPermissionForPath,
} from "@/lib/roleConfig"

export type RoleAccess = {
  role: string
  permissions: readonly PermissionKey[]
  readOnly: boolean
  canDelete: boolean
}

function sanitizePermissions(permissions: readonly string[]) {
  return permissions.filter((permission): permission is PermissionKey =>
    ALL_ADMIN_PERMISSIONS.includes(permission as PermissionKey)
  )
}

export async function getRoleAccess(role: string): Promise<RoleAccess> {
  const definition = await prisma.roleDefinition.findUnique({ where: { key: role } })
  const fallback = DEFAULT_ROLE_ACCESS[role] ?? DEFAULT_ROLE_ACCESS.STUDENT

  return {
    role,
    permissions: sanitizePermissions(definition?.permissions ?? fallback.permissions),
    readOnly: definition?.readOnly ?? fallback.readOnly,
    canDelete: definition?.canDelete ?? fallback.canDelete,
  }
}

export function isMutationMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())
}

export function canAccessApiPath(access: RoleAccess, apiPath: string, method: string, requiredPermission?: PermissionKey) {
  if (access.role === "ADMIN") return true

  const permission = requiredPermission ?? getPermissionForPath(apiPath, true)
  if (!permission || !access.permissions.includes(permission)) return false
  if (method.toUpperCase() === "DELETE" && !access.canDelete) return false
  if (isMutationMethod(method) && access.readOnly) return false
  return true
}

export function getPermissionLabel(permission: PermissionKey) {
  return ADMIN_PERMISSION_DEFINITIONS[permission].label
}
