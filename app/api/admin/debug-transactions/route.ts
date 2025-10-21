import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

export async function GET() {
  try {
    // Check admin authentication
    await adminAuth()

    // Get sample subscriptions to debug the filtering
    const subscriptions = await prisma.subscription.findMany({
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        mockTest: {
          select: {
            id: true,
            title: true,
            price: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true
          }
        },
        mockBundle: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            discountedPrice: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const debug = subscriptions.map(sub => ({
      id: sub.id,
      actualAmountPaid: sub.actualAmountPaid,
      originalPrice: sub.originalPrice,
      paid: sub.paid,
      type: sub.courseId ? "course" : sub.mockBundleId ? "bundle" : "mock",
      itemTitle: sub.course?.title || sub.mockBundle?.title || sub.mockTest?.title || "Unknown",
      calculatedAmount: sub.actualAmountPaid 
        ? sub.actualAmountPaid / 100 
        : (sub.course?.price || sub.mockTest?.price || sub.mockBundle?.discountedPrice || sub.mockBundle?.basePrice || 0),
      shouldShow: (sub.actualAmountPaid && sub.actualAmountPaid > 0) || 
                 (!sub.actualAmountPaid && (sub.course?.price || sub.mockTest?.price || sub.mockBundle?.basePrice || 0) > 0)
    }))

    return NextResponse.json({
      total: subscriptions.length,
      debug,
      summary: {
        withActualAmountPaid: debug.filter(d => d.actualAmountPaid !== null).length,
        withZeroAmount: debug.filter(d => d.calculatedAmount === 0).length,
        shouldShow: debug.filter(d => d.shouldShow).length,
        shouldHide: debug.filter(d => !d.shouldShow).length
      }
    })

  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json(
      { error: "Failed to fetch debug data" },
      { status: 500 }
    )
  }
}