import { NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"
import { ALL_ADMIN_PERMISSIONS, DEFAULT_ROLE_ACCESS, type PermissionKey } from "@/lib/roleConfig"
import { handleAuthError } from "@/lib/roleAuth"

const BUILT_IN_ROLE_NAMES: Record<string, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
}

function normalizePermissions(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is PermissionKey =>
    typeof item === "string" && ALL_ADMIN_PERMISSIONS.includes(item as PermissionKey)
  ))]
}

function createRoleKey(name: string) {
  const key = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")
  return key && !BUILT_IN_ROLE_NAMES[key] ? `CUSTOM_${key}` : "CUSTOM_ROLE"
}

export async function GET() {
  try {
    await adminAuth()
    const definitions = await prisma.roleDefinition.findMany({ orderBy: { name: "asc" } })
    const definitionsByKey = new Map(definitions.map((definition) => [definition.key, definition]))
    const builtInRoles = Object.entries(BUILT_IN_ROLE_NAMES).map(([key, name]) => ({
      key,
      name: definitionsByKey.get(key)?.name ?? name,
      isBuiltIn: true,
      ...(DEFAULT_ROLE_ACCESS[key] ?? DEFAULT_ROLE_ACCESS.STUDENT),
      ...(definitionsByKey.get(key)
        ? {
            permissions: definitionsByKey.get(key)!.permissions,
            readOnly: definitionsByKey.get(key)!.readOnly,
            canDelete: definitionsByKey.get(key)!.canDelete,
          }
        : {}),
    }))
    const customRoles = definitions.filter((role) => !BUILT_IN_ROLE_NAMES[role.key])

    return NextResponse.json({ roles: [...builtInRoles, ...customRoles.map((role) => ({ ...role, isBuiltIn: false }))] })
  } catch (error) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    console.error("Error loading role definitions:", error)
    return NextResponse.json({ error: "Unable to load roles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await adminAuth()
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "Role name must be between 2 and 60 characters" }, { status: 400 })
    }

    const permissions = normalizePermissions(body.permissions)
    const key = createRoleKey(name)
    const role = await prisma.roleDefinition.create({
      data: {
        key,
        name,
        permissions,
        readOnly: body.readOnly === true,
        canDelete: body.canDelete === true,
      },
    })
    return NextResponse.json({ role }, { status: 201 })
  } catch (error: unknown) {
    const authResponse = handleAuthError(error)
    if (authResponse) return authResponse
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A role with that name already exists" }, { status: 409 })
    }
    console.error("Error creating role definition:", error)
    return NextResponse.json({ error: "Unable to create role" }, { status: 500 })
  }
}
