import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdminApiAccess(req.url, req.method, "testimonials")
    const { id } = await params
    const body = await req.json()
    const { name, role, content, image, rating } = body

    const updated = await prisma.testimonial.update({
      where: { id },
      data: { name, role, content, image, rating },
    })

    return NextResponse.json(updated)
  } catch (error) {
    const authError = handleAuthError(error)
    if (authError) return authError
    console.error("PUT testimonial error:", error)
    return new NextResponse("Failed to update testimonial", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdminApiAccess(req.url, req.method, "testimonials")
    const { id } = await params
    await prisma.testimonial.delete({ where: { id } })
    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    const authError = handleAuthError(error)
    if (authError) return authError
    console.error("DELETE testimonial error:", error)
    return new NextResponse("Failed to delete testimonial", { status: 500 })
  }
}
