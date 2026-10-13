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

    // Hide course refund messaging across public FAQ consumers while retaining
    // the admin-managed records and unrelated mock/session FAQs.
    const publicFaqs = faqs.filter((faq: { question: string; answer: string; category?: string | null }) => {
      const text = `${faq.category ?? ''} ${faq.question} ${faq.answer}`
      const isCourseFaq = /\bcourses?\b/i.test(text)
      const mentionsRefund = /\brefund\w*\b|money[\s-]*back|no questions asked/i.test(text)
      return !(isCourseFaq && mentionsRefund)
    })

    return NextResponse.json({ data: publicFaqs, count: publicFaqs.length })
  } catch (err) {
    console.error('public/faq GET error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
