import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type FaqInput = {
  question: string
  answer: string
  category?: string
}

export async function POST(req: Request) {
  try {
    const faqs: FaqInput[] = await req.json()

    if (!Array.isArray(faqs)) {
      return NextResponse.json(
        { error: "Expected an array of FAQs" },
        { status: 400 }
      )
    }

    const inserted: any[] = []

    for (const faq of faqs) {
      if (!faq.question || !faq.answer) continue

      const created = await prisma.fAQ.create({
        data: {
          question: faq.question,
          answer: faq.answer,
          category: faq.category ?? "GENERAL", // fallback default
        },
      })

      inserted.push(created)
    }

    return NextResponse.json({
      message: "FAQs inserted successfully",
      count: inserted.length,
      data: inserted,
    })
  } catch (error) {
    console.error("Bulk FAQ insert error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
