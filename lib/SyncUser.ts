// lib/syncUser.ts
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const syncUserToDB = async () => {
  const user = await currentUser()
  if (!user) return

  const existing = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  })

  if (!existing) {
    await prisma.user.create({
      data: {
        clerkUserId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: user.firstName + ' ' + user.lastName,
      },
    })
  }
}
