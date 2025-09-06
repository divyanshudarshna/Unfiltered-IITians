// app/api/faq/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// NOTE: adjust client reference if your Prisma model name differs
const FAQ_CLIENT = (prisma as any).fAQ as any

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const q = url.searchParams.get('q')
    const limit = Math.min(100, Number(url.searchParams.get('limit') ?? 100))
    const skip = Number(url.searchParams.get('skip') ?? 0)

    const where: any = { visible: true }
    if (category) where.category = category
    if (q) {
      // Basic text search: contains in question or answer
      where.OR = [
        { question: { contains: q } },
        { answer: { contains: q } },
      ]
    }

    const faqs = await FAQ_CLIENT.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })

    return NextResponse.json({ data: faqs, count: faqs.length })
  } catch (err) {
    console.error('public/faq GET error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
