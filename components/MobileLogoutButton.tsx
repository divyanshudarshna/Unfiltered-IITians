// components/MobileLogoutButton.tsx
"use client"

import { useClerk } from "@clerk/nextjs"
import { LogOut } from "lucide-react"

interface MobileLogoutButtonProps {
  onClick?: () => void
}

export const MobileLogoutButton = ({ onClick }: MobileLogoutButtonProps) => {
  const { signOut } = useClerk()

  const handleLogout = () => {
    signOut()
    if (onClick) onClick()
  }

  return (
    <button 
      onClick={handleLogout} 
      className="flex items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
    >
      <LogOut size={18} /> <span>Logout</span>
    </button>
  )
}

export default MobileLogoutButton