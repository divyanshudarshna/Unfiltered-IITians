import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function GET() {
  try {
    // Check admin authentication
    await adminAuth()

    // Get all successful course subscriptions
    const courseSubscriptions = await prisma.subscription.findMany({
      where: {
        courseId: { not: null },
        paid: true
      },
      select: {
        actualAmountPaid: true
      }
    })

    // Calculate total revenue from courses (convert paise to rupees)
    const totalRevenue = courseSubscriptions.reduce((sum, sub) => {
      const amount = sub.actualAmountPaid ? sub.actualAmountPaid / 100 : 0
      return sum + amount
    }, 0)

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      transactionCount: courseSubscriptions.length
    })

  } catch (error) {
    console.error("Error fetching course revenue:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch course revenue", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
