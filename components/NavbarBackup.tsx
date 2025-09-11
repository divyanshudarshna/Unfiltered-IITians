"use client"
import { useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import {
  LayoutDashboard,
  User,
  FileText,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  Monitor,
  Palette,
  ChevronRight,
  BookOpen,
  Info,
  Youtube,
  Phone,
  HelpCircle,
  Calendar,Download
} from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

const Navbar = () => {
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
<nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group ml-2 sm:ml-10">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5 text-white"
            >
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
              />
            </svg>
          </div>
         <div className="flex flex-col">
  <span className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
    Unfiltered IITians
  </span>
  <span className="text-xs text-muted-foreground mt-[-2px]">
    by Divyanshu Darshana
  </span>
</div>

        </Link>

        {/* Desktop Nav */}
        <NavigationMenu className="hidden md:flex ml-auto mr-4">
          <NavigationMenuList className="flex gap-4">
            {/* Courses */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="font-medium hover:text-blue-400 transition-colors data-[state=open]:text-blue-400">
                Courses
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-4 rounded-lg shadow-lg">
              <ul className="flex flex-col gap-2 min-w-[200px]">
  <li>
    <Link
      href="/courses"
      className="flex items-center gap-2 hover:bg-accent hover:text-blue-400 px-3 py-2 rounded-md transition-colors"
    >
      <BookOpen size={16} /> All Courses
    </Link>
  </li>
  <li>
    <Link
      href="/mocks"
      className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors"
    >
      <FileText size={16} /> Mocks
    </Link>
  </li>
  <li>
    <Link
      href="/resources"
      className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors"
    >
      <Download size={16} /> Free Resources
    </Link>
  </li>
  <li>
    <Link
      href="/guidance"
      className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors"
    >
      <Calendar size={16} /> Book Sessions
    </Link>
  </li>
</ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Explore */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="font-medium hover:text-blue-400 transition-colors data-[state=open]:text-blue-400">
                Explore
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-4 rounded-lg shadow-lg">
                <ul className="flex flex-col gap-2 min-w-[200px]">
                  <li>
                    <Link
                      href="/about"
                      className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors"
                    >
                      <Info size={16} /> About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/youtube"
                      className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors"
                    >
                      <Youtube size={16} /> YouTube
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors"
                    >
                      <Phone size={16} /> Contact
                    </Link>
                  </li>
                    <li>
                    <Link
                      href="/faqs"
                      className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors"
                    >
                      <HelpCircle size={16} /> Faqs
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <SignedOut>
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          </SignedOut>

          <SignedIn>
            {/* User Dropdown */}
            <div className="hidden md:relative md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">
                    {user?.firstName || "User"}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-popover border rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="font-medium text-sm capitalize">{user?.fullName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>

                  <div className="py-2">
                    <Link href={`/${user?.firstName || "user"}/dashboard`} className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                    <Link href="/dashboard/courses" className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <User size={18} />
                      <span>My Courses</span>
                    </Link>
                    <Link href="/mocks" className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <FileText size={18} />
                      <span>Mocks</span>
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
                            {theme === mode && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="py-2 border-t">
                    <button onClick={() => signOut()} className="flex items-center gap-3 w-full px-4 py-2 text-destructive hover:bg-destructive/10 transition-colors">
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: only avatar */}
            <div className="md:hidden">
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </div>
          </SignedIn>

          {/* Mobile Toggle */}
          <button className="md:hidden ml-2 p-1.5 rounded-md hover:bg-accent transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
 {/* Mobile Menu */}
{menuOpen && (
  <div className="fixed top-16 left-0 right-0 bg-background border-b shadow-md md:hidden z-50 animate-in slide-in-from-top duration-300">
    <div className="flex flex-col p-4 gap-2">
      
      {/* ✅ Signed In User Section */}
      <SignedIn>
        <div className="flex flex-col gap-2 border-b pb-3 mb-3">
          <p className="font-medium text-sm px-3">Hello, {user?.firstName || "User"}</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/dashboard/courses"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <User size={18} />
            <span>My Courses</span>
          </Link>
          <Link
            href="/mocks"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <FileText size={18} />
            <span>Mocks</span>
          </Link>
          <button
            onClick={() => {
              signOut()
              setMenuOpen(false)
            }}
            className="flex items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </SignedIn>

      {/* Courses */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer py-2 px-3 font-medium hover:bg-accent rounded-md">
          Courses
        </summary>
        <div className="ml-4 mt-1 flex flex-col gap-2 border-l-2 border-accent pl-2">
          <Link href="/courses" className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>All Courses</Link>
          <Link href="/mocks" className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Mocks</Link>
          <Link href="/resources" className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Free Resources</Link>
          <Link href="/guidance" className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Guidance</Link>
        </div>
      </details>

      {/* Explore */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer py-2 px-3 font-medium hover:bg-accent rounded-md">
          Explore
        </summary>
        <div className="ml-4 mt-1 flex flex-col gap-2 border-l-2 border-accent pl-2">
          <Link href="/about" className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/youtube" className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>YouTube</Link>
          <Link href="/contact" className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Contact</Link>
        </div>
      </details>

      {/* Signed Out Auth Buttons */}
      <SignedOut>
        <div className="py-2 border-t mt-2 flex flex-col gap-2">
          <Link href="/sign-in" className="font-medium py-2 px-3 rounded-md border border-input hover:bg-accent transition-colors text-center" onClick={() => setMenuOpen(false)}>
            Sign In
          </Link>
          <Link href="/sign-up" className="font-medium py-2 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center" onClick={() => setMenuOpen(false)}>
            Sign Up
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
