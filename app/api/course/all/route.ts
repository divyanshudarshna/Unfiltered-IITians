// app/api/course/all/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ courses }, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching courses:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
/*

to test this api use this frontent or using postmann 
// Create Course
await fetch('/api/course/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'DSA Crash Course',
    description: 'Sharpen your data structures'
  })
})

// Get All Courses
const res = await fetch('/api/course/all')
const { courses } = await res.json()
*/