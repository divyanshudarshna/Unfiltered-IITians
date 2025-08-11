import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const mock = await prisma.mockTest.findUnique({ where: { id: params.id } })
    if (!mock) {
      return NextResponse.json({ error: 'Mock not found' }, { status: 404 })
    }
    return NextResponse.json({ mock })
  } catch (error) {
    console.error('❌ Fetch mock error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}