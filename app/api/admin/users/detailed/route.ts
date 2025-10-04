import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the current user is an admin
    const currentUser = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                price: true
              }
            },
            mockTest: {
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
                basePrice: true
              }
            }
          }
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                price: true
              }
            }
          }
        },
        mockAttempts: {
          include: {
            mockTest: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        courseProgress: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            },
            content: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      phoneNumber: user.phoneNumber,
      fieldOfStudy: user.fieldOfStudy,
      isSubscribed: user.isSubscribed,
      joinedAt: user.createdAt.toISOString().split("T")[0],
      subscriptionsCount: user.subscriptions.length,
      enrollmentsCount: user.enrollments.length,
      mockAttemptsCount: user.mockAttempts.length,
      avgMockScore: user.mockAttempts.length > 0 
        ? Math.round(user.mockAttempts.reduce((sum: number, attempt) => sum + (attempt.percentage || 0), 0) / user.mockAttempts.length)
        : 0,
      totalRevenue: user.subscriptions
        .filter((sub) => sub.paid)
        .reduce((sum: number, sub) => {
          const price = sub.course?.price || sub.mockTest?.price || sub.mockBundle?.basePrice || 0
          return sum + price
        }, 0),
      courseProgress: user.courseProgress.length > 0
        ? Math.round(user.courseProgress.reduce((sum: number, cp) => sum + cp.progress, 0) / user.courseProgress.length)
        : 0,
      subscriptions: user.subscriptions,
      enrollments: user.enrollments,
      mockAttempts: user.mockAttempts,
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Error in admin GET detailed users:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}