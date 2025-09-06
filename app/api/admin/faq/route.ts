// app/api/admin/faq/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type CreateFAQBody = {
  question: string
  answer: string
  category?: string | null
  visible?: boolean
}

// NOTE: Prisma client property depends on your model name:
// - If model is "FAQ", use prisma.fAQ
// - If model is "Faq", use prisma.faq
const FAQ_CLIENT = (prisma as any).fAQ as any

// GET: list all FAQs (with optional filters)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const visibleParam = url.searchParams.get('visible')

    const where: any = {}
    if (category) where.category = category
    if (visibleParam === 'true') where.visible = true
    if (visibleParam === 'false') where.visible = false

    const faqs = await FAQ_CLIENT.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(faqs)
  } catch (err) {
    console.error('admin/faq GET error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST: create a new FAQ
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateFAQBody
    if (!body?.question || !body?.answer) {
      return NextResponse.json({ error: 'question and answer are required' }, { status: 400 })
    }

    const created = await FAQ_CLIENT.create({
      data: {
        question: body.question,
        answer: body.answer,
        category: body.category ?? null,
        visible: body.visible ?? true,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('admin/faq POST error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT: update an existing FAQ
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, question, answer, category, visible } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const data: any = {}
    if (typeof question === 'string') data.question = question
    if (typeof answer === 'string') data.answer = answer
    if ('category' in body) data.category = category ?? null
    if ('visible' in body) data.visible = visible

    const updated = await FAQ_CLIENT.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('admin/faq PUT error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: delete an FAQ by id
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await FAQ_CLIENT.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('admin/faq DELETE error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
