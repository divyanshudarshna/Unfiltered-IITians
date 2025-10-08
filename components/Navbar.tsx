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
  const [isTablet, setIsTablet] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  // ✅ Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsTablet(width >= 768 && width < 1280) // md to xl
      
      // Close menu on desktop
      if (width >= 1280) {
        setMenuOpen(false)
      }
    }

    // Set initial value
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ✅ Preload critical routes once
  useEffect(() => {
    const prefetchRoutes = ["/courses", "/mocks", "/resources", "/dashboard", "/guidance", "/youtube", "/contact"]
    prefetchRoutes.forEach((route) => router.prefetch(route))
  }, [router])

  // ✅ Close menu when clicking outside (for mobile/tablet)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (menuOpen && !target.closest('nav') && !target.closest('.mobile-menu')) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [menuOpen])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo - Responsive sizing */}
          <Link 
            href="/" 
            prefetch 
            className="flex items-center gap-2 group flex-shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <div className="flex flex-col relative">
              <span className="font-bold text-xl sm:text-2xl text-gray-800 dark:text-white relative inline-block">
                Divyanshu <span className="text-primary/80">Darshna</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover:w-full"></span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav - Hidden on mobile and tablet */}
          <div className="hidden xl:flex items-center gap-8 2xl:gap-10">
            {/* Navigation Links */}
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "About" },
              { href: "/courses", label: "Courses" },
              { href: "/youtube", label: "Youtube" },
              { href: "/guidance", label: "Guidance" },
              { href: "/contact", label: "Contact" },
            ].map(({ href, label }) => (
              <Link 
                key={href} 
                href={href} 
                prefetch 
                className="relative font-medium text-foreground group/navlink transition-colors hover:text-primary"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
              </Link>
            ))}

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

          {/* Tablet Nav - Visible on tablet only (md to xl) */}
          <div className="hidden md:flex xl:hidden items-center gap-4">
            {/* Essential Links for tablet */}
            <Link href="/courses" prefetch className="relative font-medium text-foreground group/navlink text-sm hover:text-primary">
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
            </Link>
            
            <Link href="/guidance" prefetch className="relative font-medium text-foreground group/navlink text-sm hover:text-primary">
              Guidance
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
            </Link>

            {/* More menu for tablet */}
            <button 
              className="p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>

            {/* User section for tablet */}
            <SignedOut>
              <Link href="/sign-in" prefetch>
                <Button size="sm" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <LogIn size={14} />
                  Login
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <UserMenu />
            </SignedIn>
          </div>

          {/* Mobile Toggle with User Avatar - For mobile only */}
          <div className="flex md:hidden items-center gap-3">
            {/* Show User Avatar when signed in */}
            <SignedIn>
              <UserAvatar size={32} className="border border-primary/20" />
            </SignedIn>
            
            {/* Hamburger Menu */}
            <button 
              className="p-2 rounded-md hover:bg-accent transition-colors" 
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu - Improved responsive behavior */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden xl:hidden pt-16">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="mobile-menu relative bg-background border-b shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top duration-300">
            <div className="p-4 sm:p-6 space-y-4">
              <SignedIn>
                <div className="space-y-3 pb-4 border-b">
                  <p className="font-semibold text-lg px-2">Hello, {user?.firstName || "User"}!</p>
                  <div className="space-y-1">
                    <Link 
                      href={`/${user?.firstName || "user"}/dashboard`} 
                      prefetch 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-base"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard size={20} /> 
                      <span>Dashboard</span>
                    </Link>
                    <Link 
                      href="/dashboard/courses" 
                      prefetch 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-base"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={20} /> 
                      <span>My Courses</span>
                    </Link>
                    <Link 
                      href="/mocks" 
                      prefetch 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-base"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FileText size={20} /> 
                      <span>Mocks</span>
                    </Link>
                    <Link 
                      href="/resources" 
                      prefetch 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-base"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Download size={20} /> 
                      <span>Free Resources</span>
                    </Link>
                  </div>
                  <MobileLogoutButton onClick={() => setMenuOpen(false)} />
                </div>
              </SignedIn>

              {/* Main Navigation Links */}
              <div className={`grid gap-1 ${isTablet ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {[
                  { href: "/", label: "Home" },
                  { href: "/about", label: "About" },
                  { href: "/courses", label: "Courses" },
                  { href: "/guidance", label: "Guidance" },
                  { href: "/youtube", label: "Youtube" },
                  { href: "/contact", label: "Contact" },
                ].map(({ href, label }) => (
                  <Link 
                    key={href} 
                    href={href} 
                    prefetch 
                    className="font-medium py-3 px-4 hover:bg-accent rounded-lg transition-colors text-base flex items-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <SignedOut>
                <div className="pt-4 border-t space-y-3">
                  <Link href="/sign-in" prefetch onClick={() => setMenuOpen(false)}>
                    <Button size="lg" className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                      <LogIn size={18} />
                      Login to Your Account
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground text-center px-2">
                    Access your courses, mocks, and personalized guidance
                  </p>
                </div>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar