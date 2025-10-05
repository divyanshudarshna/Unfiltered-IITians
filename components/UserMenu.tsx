// components/UserMenu.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  User,
  FileText,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Monitor,
  Palette,
  ChevronRight,
  Download,
} from "lucide-react"
import { useUserProfileContext } from "@/contexts/UserProfileContext"
import { UserAvatar } from "./UserAvatar"

export const UserMenu = () => {
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  
  const { userProfile, clerkUser, isLoading } = useUserProfileContext()

  const displayName = userProfile?.name || clerkUser?.firstName || "User"
  const displayEmail = userProfile?.email || clerkUser?.primaryEmailAddress?.emailAddress

  if (!clerkUser || isLoading) {
    return null
  }

  return (
    <div className="relative dark:text-white text-black">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize">
            {displayName}
          </span>
          <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
        </div>
        <div className="flex items-center justify-center">
          <UserAvatar 
            key={userProfile?.profileImageUrl || clerkUser?.imageUrl || userProfile?.name}
            size={32} 
            className="border border-primary/20" 
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {userMenuOpen && (
        <div className="absolute right-0 top-12 w-56 bg-popover border rounded-lg shadow-lg py-2 z-50 animate-in fade-in-50">
          <div className="px-4 py-3 border-b">
            <p className="font-medium text-sm capitalize">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>

          <div className="py-2">
            <Link 
              href={`/${clerkUser?.firstName || "user"}/dashboard`} 
              className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" 
              onClick={() => setUserMenuOpen(false)}
            >
              <LayoutDashboard size={18} /> <span>Dashboard</span>
            </Link>
            <Link 
              href="/dashboard/courses" 
              className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" 
              onClick={() => setUserMenuOpen(false)}
            >
              <User size={18} /> <span>My Courses</span>
            </Link>
            <Link 
              href="/mocks" 
              className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" 
              onClick={() => setUserMenuOpen(false)}
            >
              <FileText size={18} /> <span>Mocks</span>
            </Link>

            {/* Free Resources */}
            <Link 
              href="/resources" 
              className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" 
              onClick={() => setUserMenuOpen(false)}
            >
              <Download size={18} /> <span>Free Resources</span>
            </Link>
          </div>

          {/* Theme Selection */}
          <div className="py-2 border-t relative">
            <button
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="flex items-center justify-between w-full px-4 py-2 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Palette size={18} />
                <span>Theme</span>
              </div>
              <ChevronRight size={16} className={`transition-transform ${themeMenuOpen ? "rotate-90" : ""}`} />
            </button>

            {themeMenuOpen && (
              <div className="ml-4 mt-1 border-l-2 border-accent pl-1">
                {["light", "dark", "system"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setTheme(mode)
                      setThemeMenuOpen(false)
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-2 rounded-md hover:bg-accent transition-colors ${
                      theme === mode ? "bg-accent" : ""
                    }`}
                  >
                    {mode === "light" && <Sun size={16} />}
                    {mode === "dark" && <Moon size={16} />}
                    {mode === "system" && <Monitor size={16} />}
                    <span className="capitalize">{mode}</span>
                    {theme === mode && <div className="ml-auto w-2 h-2 bg-violet-700 rounded-full"></div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="py-2 border-t">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 w-full px-4 py-2 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={18} /> <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu