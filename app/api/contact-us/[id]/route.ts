import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";
import { readContactAttachments } from "@/lib/contact-attachments";
import { removeContactAttachments } from "@/lib/contact-attachment-storage";

// ✅ PATCH - update contact status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdminApiAccess(new URL("/api/admin/contact-us/conversations", req.url).toString(), req.method);
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
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
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
    await assertAdminApiAccess(new URL("/api/admin/contact-us/conversations", req.url).toString(), req.method);
    const { id } = await params

    // First, find the contact to get its threadId
    const contact = await prisma.contactUs.findUnique({
      where: { id },
      select: { threadId: true, email: true }
    })

    if (!contact) {
      return new NextResponse("Contact not found", { status: 404 })
    }

    const messages = await prisma.contactUs.findMany({
      where: contact.threadId ? { threadId: contact.threadId } : { email: contact.email },
      select: { attachments: true },
    });

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
      // Legacy fallback: one conversation per email when threadId is missing
      await prisma.contactUs.updateMany({
        where: { email: contact.email },
        data: { parentId: null }
      })
      
      await prisma.contactUs.deleteMany({
        where: { email: contact.email }
      })
    }

    await removeContactAttachments(messages.flatMap((message) => readContactAttachments(message.attachments)));
    return new NextResponse("Contact deleted successfully", { status: 200 })
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("DELETE ContactUs error:", error)
    return new NextResponse("Failed to delete contact", { status: 500 })
  }
}
