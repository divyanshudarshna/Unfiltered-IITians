import { NextResponse } from "next/server"
import { getDbUserFromClerk } from "@/lib/roleAuth"
import { getRoleAccess } from "@/lib/rolePermissions"

export async function GET() {
  const user = await getDbUserFromClerk()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const access = await getRoleAccess(user.role)
  return NextResponse.json(access)
}
