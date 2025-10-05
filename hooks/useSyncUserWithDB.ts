// hooks/useSyncUserWithDB.ts
'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

export const useSyncUserWithDB = () => {
  const { user, isSignedIn } = useUser()

  useEffect(() => {
    if (isSignedIn && user) {
      fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          profileImageUrl: user.imageUrl, // Include Clerk profile image
        }),
      }).catch((err) => console.error('❌ User sync failed:', err))
    }
  }, [isSignedIn, user])
}
