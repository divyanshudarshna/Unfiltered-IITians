// app/api/subscription/confirm/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'This confirmation route is disabled. Use the signature-verified payment endpoint.' },
    { status: 410 },
  )
}
