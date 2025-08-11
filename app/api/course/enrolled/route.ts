// app/api/course/enrolled/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const enrolledCourses = await prisma.enrollment.findMany({
      where: { userId },
      include: { course: true }
    })

    return NextResponse.json({ enrolledCourses }, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching enrolled courses:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


/*
// Enroll User
await fetch('/api/course/enroll', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'abc123',
    courseId: 'course456'
  }),
  headers: { 'Content-Type': 'application/json' }
})

// Get Enrolled Courses
const res = await fetch('/api/course/enrolled?userId=abc123')
const data = await res.json()
console.log(data.enrolledCourses)
*/