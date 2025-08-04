// app/api/user/register/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clerkUserId, email, name } = body

    console.log("📦 Registering user:", { clerkUserId, email, name })

    // 1. Validate required fields
    if (!clerkUserId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (existingUser) {
      console.log("✅ User already exists:", existingUser.email)
      return NextResponse.json({ user: existingUser, created: false })
    }

    // 3. Create new user with default role
    const newUser = await prisma.user.create({
      data: {
        clerkUserId,
        email: normalizedEmail,
        name: name?.trim() || null,
        role: 'STUDENT', // default role (can be dynamic later)
      },
    })

    console.log("✅ User created and stored:", newUser.email)
    return NextResponse.json({ user: newUser, created: true })

  } catch (error: any) {
    console.error('❌ Error creating user:', error)

    // 4. Handle common Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate user' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
