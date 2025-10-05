// contexts/UserProfileContext.tsx
"use client"

import React, { createContext, useContext, useMemo } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'

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

interface UserProfileContextType {
  userProfile: UserProfile | null
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  updateProfile: (updatedProfile: Partial<UserProfile>) => void
  getProfileImageUrl: () => string | null
  clerkUser: any
  isSignedIn: boolean
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userProfileData = useUserProfile()
  
  const contextValue = useMemo(() => ({
    ...userProfileData,
    isSignedIn: userProfileData.isSignedIn ?? false,
    clerkUser: userProfileData.clerkUser || null
  }), [userProfileData])

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  )
}

export const useUserProfileContext = () => {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error('useUserProfileContext must be used within a UserProfileProvider')
  }
  return context
}

export default UserProfileContext