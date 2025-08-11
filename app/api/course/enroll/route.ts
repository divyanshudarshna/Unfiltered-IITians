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

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId
      }
    })

    return NextResponse.json({ message: 'Enrolled successfully', enrollment }, { status: 201 })
  } catch (error) {
    console.error('❌ Enrollment error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
