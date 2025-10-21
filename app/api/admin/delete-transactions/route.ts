import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    await adminAuth()

    const { transactionIds } = await request.json()

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: "Transaction IDs are required" },
        { status: 400 }
      )
    }

    // First, verify all transactions are either pending or failed (not success)
    const transactions = await prisma.subscription.findMany({
      where: {
        id: { in: transactionIds },
        paid: false // Only allow deletion of unpaid (pending/failed) transactions
      },
      select: { id: true, paid: true }
    })

    if (transactions.length !== transactionIds.length) {
      return NextResponse.json(
        { error: "Some transactions cannot be deleted (already successful or not found)" },
        { status: 400 }
      )
    }

    // Delete subscription transactions
    const deletedSubscriptions = await prisma.subscription.deleteMany({
      where: {
        id: { in: transactionIds },
        paid: false // Double-check they're not paid
      }
    })

    // Also delete any failed session enrollments with matching IDs
    await prisma.sessionEnrollment.deleteMany({
      where: {
        id: { in: transactionIds },
        paymentStatus: { in: ["PENDING", "FAILED"] }
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deletedSubscriptions.count,
      message: `Successfully deleted ${deletedSubscriptions.count} transaction(s)`
    })

  } catch (error) {
    console.error("Error deleting transactions:", error)
    return NextResponse.json(
      { error: "Failed to delete transactions" },
      { status: 500 }
    )
  }
}