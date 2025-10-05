"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs"
import {
  LayoutDashboard,
  User,
  FileText,
  Menu,
  X,
  Download,
  LogIn
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { UserMenu } from "@/components/UserMenu"
import { UserAvatar } from "@/components/UserAvatar"
import { MobileLogoutButton } from "@/components/MobileLogoutButton"

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  // ✅ Preload critical routes once
  useEffect(() => {
    const prefetchRoutes = ["/courses", "/mocks", "/resources", "/dashboard", "/guidance", "/youtube", "/contact"]
    prefetchRoutes.forEach((route) => router.prefetch(route))
  }, [router])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
        
        {/* Logo - Extreme Left */}
        <Link href="/" prefetch className="flex items-center gap-4 group ml-2 sm:ml-10">
          <div className="flex flex-col relative">
            <span className="font-bold text-2xl text-gray-800 dark:text-white relative inline-block">
              Divyanshu <span className="text-primary/80">Darshna</span>
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover:w-full"></span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav - Moved to Right Side */}
        <div className="hidden md:flex items-center gap-10 mr-2 sm:mr-10">
          {/* Home */}
          <Link href="/" prefetch className="relative font-medium text-foreground group/navlink">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
          </Link>

          {/* About */}
          <Link href="/about" prefetch className="relative font-medium text-foreground group/navlink">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
          </Link>

          {/* Courses - simple link */}
          <Link href="/courses" prefetch className="relative font-medium text-foreground group/navlink">
            Courses
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
          </Link>

          {/* Youtube */}
          <Link href="/youtube" prefetch className="relative font-medium text-foreground group/navlink">
            Youtube
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
          </Link>

          {/* Guidance */}
          <Link href="/guidance" prefetch className="relative font-medium text-foreground group/navlink">
            Guidance
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
          </Link>

          {/* Contact */}
          <Link href="/contact" prefetch className="relative font-medium text-foreground group/navlink">
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
          </Link>

          {/* Signed Out - Single Login Button */}
          <SignedOut>
            <Link href="/sign-in" prefetch>
              <Button size="sm" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <LogIn size={16} />
                Login
              </Button>
            </Link>
          </SignedOut>

          {/* Signed In - User Dropdown */}
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </div>

        {/* Mobile Toggle with User Avatar */}
        <div className="md:hidden flex items-center gap-2">
          {/* Show User Avatar when signed in */}
          <SignedIn>
            <UserAvatar size={32} className="border border-primary/20" />
          </SignedIn>
          
          {/* Hamburger Menu */}
          <button className="ml-2 p-1.5 rounded-md hover:bg-accent transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-background border-b shadow-md md:hidden z-50 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-4 gap-2">
            <SignedIn>
              <div className="flex flex-col gap-2 border-b pb-3 mb-3">
                <p className="font-medium text-sm px-3">Hello, {user?.firstName || "User"}</p>
                <Link href="/dashboard" prefetch className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard size={18} /> <span>Dashboard</span>
                </Link>
                <Link href="/dashboard/courses" prefetch className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors" onClick={() => setMenuOpen(false)}>
                  <User size={18} /> <span>My Courses</span>
                </Link>
                <Link href="/mocks" prefetch className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors" onClick={() => setMenuOpen(false)}>
                  <FileText size={18} /> <span>Mocks</span>
                </Link>

                {/* Free Resources moved here */}
                <Link href="/resources" prefetch className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors" onClick={() => setMenuOpen(false)}>
                  <Download size={18} /> <span>Free Resources</span>
                </Link>

                <MobileLogoutButton onClick={() => setMenuOpen(false)} />
              </div>
            </SignedIn>

            {/* Main Links */}
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "About" },
              { href: "/courses", label: "Courses" },
              { href: "/guidance", label: "Guidance" },
              { href: "/contact", label: "Contact" },
              { href: "/youtube", label: "Youtube" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} prefetch className="font-medium py-2 px-3 hover:bg-accent rounded-md transition-colors" onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}

            <SignedOut>
              <div className="py-2 border-t mt-2 flex flex-col gap-2">
                <Link href="/sign-in" prefetch>
                  <Button size="sm" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <LogIn size={16} />
                    Login
                  </Button>
                </Link>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
