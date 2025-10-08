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

    // Get all sessions with their enrollments
    const sessions = await prisma.session.findMany({
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                clerkUserId: true
              }
            }
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    })

    // Transform the data
    const stats = sessions.map(session => {
      const totalEnrollments = session.enrollments.length
      const paidEnrollments = session.enrollments.filter(enrollment => enrollment.paymentStatus === 'SUCCESS')
      const totalRevenue = paidEnrollments.reduce((sum: number, enrollment) => {
        return sum + (enrollment.amountPaid || 0)
      }, 0)
      
      return {
        id: session.id,
        title: session.title,
        type: session.type,
        price: session.price,
        discountedPrice: session.discountedPrice,
        maxEnrollment: session.maxEnrollment,
        totalEnrollments,
        paidEnrollments: paidEnrollments.length,
        totalRevenue,
        enrollments: session.enrollments.map(enrollment => ({
          id: enrollment.id,
          user: {
            id: enrollment.user.id,
            name: enrollment.user.name || enrollment.studentName || 'N/A',
            email: enrollment.user.email || enrollment.studentEmail,
            phoneNumber: enrollment.user.phoneNumber || enrollment.studentPhone
          },
          studentName: enrollment.studentName,
          studentEmail: enrollment.studentEmail,
          studentPhone: enrollment.studentPhone,
          paymentStatus: enrollment.paymentStatus,
          amountPaid: enrollment.amountPaid,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          razorpayOrderId: enrollment.razorpayOrderId,
          razorpayPaymentId: enrollment.razorpayPaymentId
        }))
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching session enrollment stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}