// app/api/user/profile/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clerkUserId = searchParams.get('clerkUserId')

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        mockAttempts: {
          include: {
            mockTest: true,
          },
        },
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('❌ Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

//IT WILL RETURN EVERYTHING LINKED TO USER PROFILE BASED ON THE CLERK USER ID
// USE CASES OF THIS ABOVE API IS 
/*
const res = await fetch(`/api/user/profile?clerkUserId=${clerkUserId}`)
const { user } = await res.json()
*/