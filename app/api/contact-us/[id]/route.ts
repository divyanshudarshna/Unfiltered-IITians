import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// ✅ PATCH - update contact status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

// ✅ DELETE - permanently delete a contact and all its thread messages
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First, find the contact to get its threadId
    const contact = await prisma.contactUs.findUnique({
      where: { id },
      select: { threadId: true }
    })

    if (!contact) {
      return new NextResponse("Contact not found", { status: 404 })
    }

    // If this contact is part of a thread, delete all messages in the thread
    if (contact.threadId) {
      // Step 1: Clear all parentId references in the thread to break the relation
      await prisma.contactUs.updateMany({
        where: { threadId: contact.threadId },
        data: { parentId: null }
      })
      
      // Step 2: Now safely delete all messages in the thread
      await prisma.contactUs.deleteMany({
        where: { threadId: contact.threadId }
      })
    } else {
      // If no threadId, clear parentId first then delete
      await prisma.contactUs.update({
        where: { id },
        data: { parentId: null }
      })
      
      await prisma.contactUs.delete({
        where: { id }
      })
    }

    return new NextResponse("Contact deleted successfully", { status: 200 })
  } catch (error) {
    console.error("DELETE ContactUs error:", error)
    return new NextResponse("Failed to delete contact", { status: 500 })
  }
}
