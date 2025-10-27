// app/api/user/profile/update/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const {
      clerkUserId,
      name,
      phoneNumber,
      dob,
      fieldOfStudy,
      profileImageUrl,
    } = body

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // console.log("🔍 Incoming request body:", body)
    // console.log("🔑 Clerk User ID:", clerkUserId)
    // console.log("📞 Phone:", phoneNumber, "DOB:", dob)


    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { clerkUserId },
      data: {
        name,
        phoneNumber,
        dob: dob ? new Date(dob) : undefined,
        fieldOfStudy,
        profileImageUrl,
      },
    })

    return NextResponse.json({ user: updatedUser, updated: true })
  } catch (error) {
    // console.error('❌ Error updating user profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


// HOW TO TEST THIS API USING POSTMAN 
/*
{
  "clerkUserId": "user_abc123",
  "name": "John Doe",
  "phoneNumber": "9876543210",
  "dob": "2002-01-15",
  "fieldOfStudy": "Computer Science",
  "profileImageUrl": "https://res.cloudinary.com/xyz/image/upload/v12345/sample.jpg"
}

*/