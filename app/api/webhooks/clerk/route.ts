import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new NextResponse('Error occurred', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data

    const email = email_addresses[0]?.email_address
    const name = `${first_name || ''} ${last_name || ''}`.trim() || null

    // Get role from public metadata or default to STUDENT
    const role = (public_metadata?.role as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT') || 'STUDENT'

    try {
      await prisma.user.create({
        data: {
          clerkUserId: id,
          email,
          name,
          profileImageUrl: image_url,
          role,
        },
      })

      console.log(`✅ Created user in database: ${email} with role: ${role}`)
    } catch (error) {
      console.error('Error creating user in database:', error)
      // If user already exists, update instead
      try {
        await prisma.user.update({
          where: { clerkUserId: id },
          data: {
            email,
            name,
            profileImageUrl: image_url,
            role,
          },
        })
        console.log(`✅ Updated existing user: ${email}`)
      } catch (updateError) {
        console.error('Error updating user:', updateError)
      }
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data

    const email = email_addresses[0]?.email_address
    const name = `${first_name || ''} ${last_name || ''}`.trim() || null

    // ✅ Sync role from Clerk to database
    const role = (public_metadata?.role as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT') || 'STUDENT'

    try {
      const updatedUser = await prisma.user.update({
        where: { clerkUserId: id },
        data: {
          email,
          name,
          profileImageUrl: image_url,
          role, // ✅ Update role from Clerk
        },
      })

      console.log(`✅ Synced user update from Clerk: ${email} with role: ${role}`)
      
      // Log if role was changed
      if (updatedUser.role !== role) {
        console.log(`🔄 Role changed from ${updatedUser.role} to ${role} for user ${email}`)
      }
    } catch (error) {
      console.error('Error updating user in database:', error)
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Delete user and all related data
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { clerkUserId: id },
          select: { id: true, email: true }
        })

        if (!user) {
          console.log(`User with Clerk ID ${id} not found in database`)
          return
        }

        // Delete all related records
        await tx.mockAttempt.deleteMany({ where: { userId: user.id } })
        await tx.subscription.deleteMany({ where: { userId: user.id } })
        await tx.enrollment.deleteMany({ where: { userId: user.id } })
        await tx.courseProgress.deleteMany({ where: { userId: user.id } })
        await tx.sessionEnrollment.deleteMany({ where: { userId: user.id } })
        await tx.courseFeedback.deleteMany({ where: { userId: user.id } })
        await tx.feedbackReply.deleteMany({ where: { adminId: user.id } })
        await tx.announcementRecipient.deleteMany({ where: { userId: user.id } })
        await tx.feedbackReplyRecipient.deleteMany({ where: { userId: user.id } })
        
        // Delete the user
        await tx.user.delete({ where: { clerkUserId: id } })

        console.log(`✅ Deleted user from database: ${user.email}`)
      })
    } catch (error) {
      console.error('Error deleting user from database:', error)
    }
  }

  return new NextResponse('Webhook processed successfully', { status: 200 })
}
