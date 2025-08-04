// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logging'

export const dynamic = 'force-dynamic' // Ensure edge-compatibility

export async function POST(req: Request) {
  // 1. Verify Webhook Signature
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    log.error('CLERK_WEBHOOK_SECRET is missing')
    return Response.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const headerPayload = headers()
  const signature = {
    svixId: headerPayload.get('svix-id'),
    svixTimestamp: headerPayload.get('svix-timestamp'),
    svixSignature: headerPayload.get('svix-signature')
  }

  if (!signature.svixId || !signature.svixTimestamp || !signature.svixSignature) {
    log.warn('Missing webhook headers', { headers: Object.fromEntries(headerPayload) })
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.text() // Keep as text for signature verification
  const wh = new Webhook(WEBHOOK_SECRET)

  let event: WebhookEvent
  try {
    event = wh.verify(payload, signature) as WebhookEvent
    log.info(`Processing Clerk event: ${event.type}`)
  } catch (err) {
    log.error('Webhook verification failed', { error: err })
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 2. Process Events
  try {
    switch (event.type) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name } = event.data
        await prisma.user.create({
          data: {
            clerkUserId: id,
            email: email_addresses[0].email_address,
            name: [first_name, last_name].filter(Boolean).join(' '),
            role: (event.data.public_metadata?.role as string) || 'STUDENT'
          },
          select: { id: true } // Only return what we need
        })
        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name } = event.data
        await prisma.user.update({
          where: { clerkUserId: id },
          data: {
            email: email_addresses[0].email_address,
            name: [first_name, last_name].filter(Boolean).join(' '),
            role: (event.data.public_metadata?.role as string) || 'STUDENT'
          }
        })
        break
      }

      case 'user.deleted': {
        await prisma.user.delete({
          where: { clerkUserId: event.data.id },
          select: { id: true } // Soft-delete alternative in notes below
        })
        break
      }

      default:
        log.warn(`Unhandled event type: ${event.type}`)
    }

    return Response.json({ success: true })
  } catch (error) {
    log.error('Database operation failed', { 
      error,
      eventType: event.type,
      userId: event.data.id 
    })

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Duplicate user entry detected' },
        { status: 409 }
      )
    }

    return Response.json(
      { error: 'Processing failed', details: error.message },
      { status: 500 }
    )
  }
}