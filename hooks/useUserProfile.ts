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
        console.log('📥 Profile fetched from API:', data.user);
        setUserProfile(data.user)
        setError(null)
      } catch (err) {
        console.error('❌ Error fetching user profile:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setUserProfile(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [isSignedIn, clerkUser?.id, clerkUser?.updatedAt]) // Add updatedAt to dependency array

  const refreshProfile = useCallback(async () => {
    if (!isSignedIn || !clerkUser?.id) {
      console.log('⚠️ Cannot refresh profile - not signed in or no clerk user ID');
      return;
    }

    try {
      setIsLoading(true)
      console.log('🔄 Refreshing profile for user:', clerkUser.id);
      
      const res = await fetch(`/api/user/profile?clerkUserId=${clerkUser.id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch user profile')
      }
      const data = await res.json()
      console.log('✅ Profile refreshed successfully:', data.user);
      
      setUserProfile(data.user)
      setError(null)
    } catch (err) {
      console.error('❌ Error refreshing user profile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [isSignedIn, clerkUser?.id])

  // Listen for profile update events
  useEffect(() => {
    const unsubscribe = profileUpdateEmitter.subscribe(() => {
      console.log('📡 Received profile update event, refreshing...');
      refreshProfile();
    });

    return unsubscribe;
  }, [refreshProfile]);

  const updateProfile = (updatedProfile: Partial<UserProfile>) => {
    console.log('🔄 Updating profile in context:', updatedProfile);
    if (userProfile) {
      const newProfile = { ...userProfile, ...updatedProfile };
      console.log('✅ New profile state:', newProfile);
      setUserProfile(newProfile);
    } else {
      console.log('⚠️ Cannot update profile - no existing profile');
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