// app/api/course/create/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || null
      }
    })

    return NextResponse.json({ message: 'Course created', course }, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating course:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
