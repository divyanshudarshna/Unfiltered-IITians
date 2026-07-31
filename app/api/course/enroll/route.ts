// app/api/course/enroll/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'Direct enrollment is disabled. Complete verified checkout or contact an administrator.' },
    { status: 410 },
  )
}
