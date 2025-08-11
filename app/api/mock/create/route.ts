import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, description, price = 0, questions, tags = [], difficulty = 'EASY' } = body

    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    const newMock = await prisma.mockTest.create({
      data: {
        title,
        description: description || null,
        price: Number(price),
        questions,
        tags,
        difficulty
      }
    })

    return NextResponse.json({ mockTest: newMock }, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating mock test:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
