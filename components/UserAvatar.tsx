// components/UserAvatar.tsx
"use client"

import Image from "next/image"
import { useUserProfileContext } from "@/contexts/UserProfileContext"
import { Skeleton } from "@/components/ui/skeleton"

interface UserAvatarProps {
  size?: number
  className?: string
}

export const UserAvatar = ({ 
  size = 32, 
  className = ""
}: UserAvatarProps) => {
  const { getProfileImageUrl, isLoading, userProfile, clerkUser } = useUserProfileContext()

  const imageUrl = getProfileImageUrl()
  const displayName = userProfile?.name || clerkUser?.firstName || "User"
  
  console.log('🎨 UserAvatar render:', {
    imageUrl,
    displayName,
    userProfile: userProfile?.profileImageUrl,
    clerkUser: clerkUser?.imageUrl,
    isLoading
  });

  if (isLoading) {
    return (
      <Skeleton 
        className={`rounded-full ${className}`} 
        style={{ width: size, height: size }} 
      />
    )
  }

  // Generate a simple avatar with initials if no image is available
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const showInitials = !imageUrl
  const initials = getInitials(displayName)

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showInitials ? (
        <div 
          className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </div>
      ) : (
        <Image
          src={imageUrl}
          alt={`${displayName}'s profile`}
          fill
          className="object-cover"
          sizes={`${size}px`}
          priority={size > 24} // Prioritize larger avatars
          onError={(e) => {
            // Hide the image on error and show initials instead
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      )}
    </div>
  )
}

export default UserAvatar