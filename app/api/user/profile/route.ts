// app/api/user/profile/route.ts
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const PROFILE_INCLUDE = {
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
} as const

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clerkUserId = searchParams.get('clerkUserId')

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: PROFILE_INCLUDE,
    })

    // Auto-sync: webhook may have been missed (common in local dev)
    if (!user) {
      console.warn(`[profile] No DB user for clerkUserId ${clerkUserId} — attempting auto-sync`)
      const clerkUser = await currentUser()
      if (clerkUser && clerkUser.id === clerkUserId) {
        const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
        const name = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || null
        const role = (clerkUser.publicMetadata?.role as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT') || 'STUDENT'

        await prisma.user.upsert({
          where: { clerkUserId },
          create: { clerkUserId, email, name, profileImageUrl: clerkUser.imageUrl, role },
          update: { email, name, profileImageUrl: clerkUser.imageUrl },
        })
        

        user = await prisma.user.findUnique({
          where: { clerkUserId },
          include: PROFILE_INCLUDE,
        })
      }
    }

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