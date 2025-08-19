import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// ✅ PATCH - update contact status
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { status } = body

    if (!["PENDING", "RESOLVED", "DELETED"].includes(status)) {
      return new NextResponse("Invalid status value", { status: 400 })
    }

    const updated = await prisma.contactUs.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PATCH ContactUs error:", error)
    return new NextResponse("Failed to update contact", { status: 500 })
  }
}

// ✅ DELETE - permanently delete a contact
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.contactUs.delete({
      where: { id },
    })

    return new NextResponse("Contact deleted successfully", { status: 200 })
  } catch (error) {
    console.error("DELETE ContactUs error:", error)
    return new NextResponse("Failed to delete contact", { status: 500 })
  }
}
