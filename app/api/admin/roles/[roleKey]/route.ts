import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"
import { ALL_ADMIN_PERMISSIONS, type PermissionKey } from "@/lib/roleConfig"
import { handleAuthError } from "@/lib/roleAuth"

const BUILT_IN_ROLE_KEYS = new Set(["ADMIN", "INSTRUCTOR", "STUDENT"])

function normalizePermissions(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is PermissionKey =>
    typeof item === "string" && ALL_ADMIN_PERMISSIONS.includes(item as PermissionKey)
  ))]
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roleKey: string }> }
) {
  try {
    await adminAuth()
    const { roleKey } = await params
    if (roleKey === "ADMIN") {
      return NextResponse.json({ error: "The Admin role always has full access" }, { status: 400 })
    }
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : undefined
    if (name !== undefined && (name.length < 2 || name.length > 60)) {
      return NextResponse.json({ error: "Role name must be between 2 and 60 characters" }, { status: 400 })
    }

    const role = await prisma.roleDefinition.upsert({
      where: { key: roleKey },
      create: {
        key: roleKey,
        name: name ?? roleKey,
        permissions: normalizePermissions(body.permissions),
        readOnly: body.readOnly === true,
        canDelete: body.canDelete === true,
      },
      update: {
        ...(name !== undefined ? { name } : {}),
        ...(Array.isArray(body.permissions) ? { permissions: normalizePermissions(body.permissions) } : {}),
        ...(typeof body.readOnly === "boolean" ? { readOnly: body.readOnly } : {}),
        ...(typeof body.canDelete === "boolean" ? { canDelete: body.canDelete } : {}),
      },
    })
    return NextResponse.json({ role: { ...role, isBuiltIn: BUILT_IN_ROLE_KEYS.has(roleKey) } })
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error("Error updating role definition:", error)
    return NextResponse.json({ error: "Unable to update role" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ roleKey: string }> }
) {
  try {
    await adminAuth()
    const { roleKey } = await params
    if (BUILT_IN_ROLE_KEYS.has(roleKey)) return NextResponse.json({ error: "Built-in roles cannot be deleted" }, { status: 400 })
    const assignedUsers = await prisma.user.count({ where: { role: roleKey } })
    if (assignedUsers > 0) return NextResponse.json({ error: "Reassign all users before deleting this role" }, { status: 409 })
    await prisma.roleDefinition.delete({ where: { key: roleKey } })
    return NextResponse.json({ message: "Role deleted" })
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error("Error deleting role definition:", error)
    return NextResponse.json({ error: "Unable to delete role" }, { status: 500 })
  }
}
