// app/api/course/enroll/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId, courseId } = await req.json()

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Missing userId or courseId' }, { status: 400 })
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findFirst({
      where: { userId, courseId }
    })

    if (existing) {
      return NextResponse.json({ message: 'User already enrolled' }, { status: 200 })
    }

    // Get course to calculate expiry date
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { durationMonths: true }
    });
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Calculate expiry date based on course duration
    const expiresAt = new Date(Date.now() + (course.durationMonths * 30 * 24 * 60 * 60 * 1000)); // months to milliseconds

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        expiresAt
      }
    })

    return NextResponse.json({ message: 'Enrolled successfully', enrollment }, { status: 201 })
  } catch (error) {
    console.error('❌ Enrollment error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
