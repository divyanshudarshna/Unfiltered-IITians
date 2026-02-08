// hooks/useUserProfile.ts
'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState, useCallback } from 'react'
import { profileUpdateEmitter } from '@/lib/profileUpdateEmitter'

interface UserProfile {
  id: string
  name: string | null
  email: string
  profileImageUrl: string | null
  role: string
  phoneNumber: string | null
  fieldOfStudy: string | null
  dob: Date | null
  createdAt: Date
}

export const useUserProfile = () => {
  const { user: clerkUser, isSignedIn } = useUser()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isSignedIn || !clerkUser?.id) {
        setUserProfile(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const res = await fetch(`/api/user/profile?clerkUserId=${clerkUser.id}`)
        if (!res.ok) {
          throw new Error('Failed to fetch user profile')
        }
        const data = await res.json()
        setUserProfile(data.user)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setUserProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [isSignedIn, clerkUser?.id]) // ✅ Removed clerkUser?.updatedAt to prevent infinite loops

  const refreshProfile = useCallback(async () => {
    if (!isSignedIn || !clerkUser?.id) {
      return;
    }

    try {
      setIsLoading(true)
      
      const res = await fetch(`/api/user/profile?clerkUserId=${clerkUser.id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch user profile')
      }
      const data = await res.json()
      
      setUserProfile(data.user)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [isSignedIn, clerkUser?.id])

  // Listen for profile update events
  useEffect(() => {
    const unsubscribe = profileUpdateEmitter.subscribe(() => {
      refreshProfile();
    });

    return unsubscribe;
  }, [refreshProfile]);

  const updateProfile = (updatedProfile: Partial<UserProfile>) => {
    if (userProfile) {
      const newProfile = { ...userProfile, ...updatedProfile };
      setUserProfile(newProfile);
    }
  }

  // Determine the profile image URL with fallback logic
  const getProfileImageUrl = () => {
    // Return the user's uploaded profile image if it exists
    if (userProfile?.profileImageUrl?.trim()) {
      return userProfile.profileImageUrl
    }
    // Return Clerk's image as fallback
    if (clerkUser?.imageUrl?.trim()) {
      return clerkUser.imageUrl
    }
    // Return null to show initials avatar
    return null
  }

  return {
    userProfile,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
    getProfileImageUrl,
    clerkUser,
    isSignedIn
  }
}