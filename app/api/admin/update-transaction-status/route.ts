import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/adminAuth"

interface UpdateResult {
  id: string
  type?: 'subscription' | 'session'
  success: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await adminAuth()

    const body = await request.json()
    const { transactionIds, securityPassword } = body

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid transaction IDs" },
        { status: 400 }
      )
    }

    if (!securityPassword) {
      return NextResponse.json(
        { error: "Security password is required" },
        { status: 400 }
      )
    }

    // Verify security password
    const expectedPassword = process.env.SECURITY_PASSWORD
    if (securityPassword !== expectedPassword) {
      return NextResponse.json(
        { error: "Invalid security password" },
        { status: 403 }
      )
    }

    let updatedCount = 0
    const results: UpdateResult[] = []

    // Process each transaction
    for (const transactionId of transactionIds) {
      try {
        // Try to find as Subscription first
        const subscription = await prisma.subscription.findUnique({
          where: { id: transactionId },
          include: {
            user: true,
            course: {
              include: {
                inclusions: true
              }
            },
            mockTest: true,
            mockBundle: {
              select: {
                id: true,
                title: true,
                mockIds: true
              }
            }
          }
        })

        if (subscription) {
          // Update subscription to paid
          await prisma.subscription.update({
            where: { id: transactionId },
            data: {
              paid: true,
              paidAt: new Date()
            }
          })

          // Handle course subscription - create enrollment
          if (subscription.courseId && subscription.course) {
            const existingEnrollment = await prisma.enrollment.findFirst({
              where: {
                userId: subscription.userId,
                courseId: subscription.courseId
              }
            })

            if (!existingEnrollment) {
              const expiryDate = new Date()
              expiryDate.setMonth(expiryDate.getMonth() + (subscription.course.durationMonths || 12))

              await prisma.enrollment.create({
                data: {
                  userId: subscription.userId,
                  courseId: subscription.courseId,
                  expiresAt: expiryDate
                }
              })

              // Grant access to included mocks if any
              if (subscription.course.inclusions && subscription.course.inclusions.length > 0) {
                for (const inclusion of subscription.course.inclusions) {
                  if (inclusion.inclusionType === 'MOCK_TEST') {
                    // Create a subscription for each included mock
                    const existingMockSub = await prisma.subscription.findFirst({
                      where: {
                        userId: subscription.userId,
                        mockTestId: inclusion.inclusionId,
                        paid: true
                      }
                    })

                    if (!existingMockSub) {
                      const mockTest = await prisma.mockTest.findUnique({
                        where: { id: inclusion.inclusionId },
                        select: { price: true }
                      })

                      await prisma.subscription.create({
                        data: {
                          userId: subscription.userId,
                          mockTestId: inclusion.inclusionId,
                          razorpayOrderId: `course_inclusion_${subscription.razorpayOrderId}`,
                          paid: true,
                          paidAt: new Date(),
                          actualAmountPaid: 0, // Included in course price
                          originalPrice: mockTest?.price || 0
                        }
                      })
                    }
                  }
                }
              }
            }
          }

          // Handle mock bundle subscription - create subscriptions for all mocks
          if (subscription.mockBundleId && subscription.mockBundle) {
            const mockIds = subscription.mockBundle.mockIds || []
            
            for (const mockId of mockIds) {
              const existingMockSub = await prisma.subscription.findFirst({
                where: {
                  userId: subscription.userId,
                  mockTestId: mockId,
                  paid: true
                }
              })

              if (!existingMockSub) {
                await prisma.subscription.create({
                  data: {
                    userId: subscription.userId,
                    mockTestId: mockId,
                    razorpayOrderId: `bundle_${subscription.razorpayOrderId}`,
                    paid: true,
                    paidAt: new Date(),
                    actualAmountPaid: 0, // Included in bundle price
                  }
                })
              }
            }
          }

          // Update user's isSubscribed status
          await prisma.user.update({
            where: { id: subscription.userId },
            data: { isSubscribed: true }
          })

          updatedCount++
          results.push({
            id: transactionId,
            type: 'subscription',
            success: true
          })
          continue
        }

        // Try to find as SessionEnrollment
        const sessionEnrollment = await prisma.sessionEnrollment.findUnique({
          where: { id: transactionId }
        })

        if (sessionEnrollment) {
          // Update session enrollment to SUCCESS
          await prisma.sessionEnrollment.update({
            where: { id: transactionId },
            data: {
              paymentStatus: 'SUCCESS',
              completedAt: new Date()
            }
          })

          updatedCount++
          results.push({
            id: transactionId,
            type: 'session',
            success: true
          })
          continue
        }

        // Transaction not found
        results.push({
          id: transactionId,
          success: false,
          error: 'Transaction not found'
        })

      } catch (error: unknown) {
        console.error(`Error processing transaction ${transactionId}:`, error)
        results.push({
          id: transactionId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedCount} transaction(s)`,
      updatedCount,
      results
    })

  } catch (error: unknown) {
    console.error("Error updating transaction status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
