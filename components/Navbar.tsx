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
  Download,
  LogIn
} from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const Navbar = () => {
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  // ✅ Preload critical routes once
  useEffect(() => {
    setMounted(true)
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

  {/* Courses Dropdown */}
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger className="font-medium hover:text-violet-700 text-black dark:text-white transition-colors data-[state=open]:text-violet-700 flex items-center gap-1  relative group/navlink">
          Courses
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-700 transition-all duration-300 group-hover/navlink:w-full"></span>
        </NavigationMenuTrigger>
        <NavigationMenuContent className="rounded-lg shadow-lg">
          <ul className="flex flex-col gap-2 min-w-[200px]">
            <li>
              <Link href="/courses" prefetch className="flex items-center gap-2 hover:bg-accent hover:text-violet-700 px-3 py-2 rounded-md transition-colors">
                <BookOpen size={16} /> All Courses
              </Link>
            </li>
            <li>
              <Link href="/mockBundles" prefetch className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors">
                <FileText size={16} /> Mocks
              </Link>
            </li>
            <li>
              <Link href="/resources" prefetch className="flex items-center gap-2 hover:bg-accent px-3 py-2 rounded-md transition-colors">
                <Download size={16} /> Free Resources
              </Link>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>

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
            <div className="relative dark:text-white text-black">
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

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-popover border rounded-lg shadow-lg py-2 z-50 animate-in fade-in-50">
                  <div className="px-4 py-3 border-b">
                    <p className="font-medium text-sm capitalize">{user?.fullName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>

                  <div className="py-2">
                    <Link href={`/${user?.firstName || "user"}/dashboard`} prefetch className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard size={18} /> <span>Dashboard</span>
                    </Link>
                    <Link href="/dashboard/courses" prefetch className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <User size={18} /> <span>My Courses</span>
                    </Link>
                    <Link href="/mockBundles" prefetch className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <FileText size={18} /> <span>Mocks</span>
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
          </SignedIn>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden ml-2 p-1.5 rounded-md hover:bg-accent transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu - UNCHANGED */}
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
                <button onClick={() => { signOut(); setMenuOpen(false) }} className="flex items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <LogOut size={18} /> <span>Logout</span>
                </button>
              </div>
            </SignedIn>

            {/* Main Links */}
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "About" },
              { href: "/guidance", label: "Guidance" },
              { href: "/contact", label: "Contact" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} prefetch className="font-medium py-2 px-3 hover:bg-accent rounded-md transition-colors" onClick={() => setMenuOpen(false)}>
                {label}
              </Link>
            ))}

            {/* Courses Accordion */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer py-2 px-3 font-medium hover:bg-accent rounded-md">
                Courses
                <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
              </summary>
              <div className="ml-4 mt-1 flex flex-col gap-2 border-l-2 border-accent pl-2">
                <Link href="/courses" prefetch className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>All Courses</Link>
                <Link href="/mocks" prefetch className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Mocks</Link>
                <Link href="/resources" prefetch className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Free Resources</Link>
                <Link href="/guidance" prefetch className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Book Sessions</Link>
              </div>
            </details>

            {/* YouTube Accordion */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer py-2 px-3 font-medium hover:bg-accent rounded-md">
                YouTube
                <ChevronRight size={16} className="group-open:rotate-90 transition-transform" />
              </summary>
              <div className="ml-4 mt-1 flex flex-col gap-2 border-l-2 border-accent pl-2">
                <Link href="/youtube" prefetch className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Videos</Link>
                <Link href="/youtube/channel" prefetch className="text-sm py-1 hover:underline" onClick={() => setMenuOpen(false)}>Channel</Link>
              </div>
            </details>

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