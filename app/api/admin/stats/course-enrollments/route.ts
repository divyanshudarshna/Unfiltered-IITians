import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch course enrollment statistics
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { enrolledAt: 'desc' }
        },
        subscriptions: {
          where: { paid: true },
          select: {
            id: true,
            userId: true,
            actualAmountPaid: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            subscriptions: {
              where: { paid: true }
            }
          }
        }
      },
      orderBy: { title: 'asc' }
    })

    // Process data for each course
    const courseStats = courses.map(course => {
      const now = new Date()
      const activeEnrollments = course.enrollments.filter(enrollment => 
        !enrollment.expiresAt || new Date(enrollment.expiresAt) > now
      ).length

      // ✅ Calculate revenue from subscriptions using actualAmountPaid
      const revenue = course.subscriptions.reduce((sum: number, sub) => {
        // Use actualAmountPaid if available (handles discounts correctly)
        if (sub.actualAmountPaid !== null && sub.actualAmountPaid !== undefined) {
          return sum + (sub.actualAmountPaid / 100); // Convert paise to rupees
        }
        
        // Fallback to course price for old records
        return sum + (course.actualPrice || course.price);
      }, 0)

      return {
        id: course.id,
        title: course.title,
        totalEnrollments: course._count.enrollments,
        activeEnrollments,
        revenue,
        averageRating: null, // You can add rating logic here if you have a rating system
        enrollments: course.enrollments.map(enrollment => ({
          id: enrollment.id,
          user: {
            name: enrollment.user.name,
            email: enrollment.user.email
          },
          enrolledAt: enrollment.enrolledAt.toISOString(),
          expiresAt: enrollment.expiresAt?.toISOString() || null,
          isActive: !enrollment.expiresAt || new Date(enrollment.expiresAt) > now
        }))
      }
    })

    return NextResponse.json(courseStats)
  } catch (error) {
    console.error('Error fetching course enrollment stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}