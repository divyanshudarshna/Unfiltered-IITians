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
} from "lucide-react"


import { Moon, Sun, Menu, X } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

const Navbar = () => {
   const { signOut } = useClerk()


  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useUser()

  console.log("Current User:", user)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="px-6 py-4 border-b shadow-sm bg-background sticky top-0 z-50">
      <div className="flex justify-between items-center">
        {/* Desktop Nav */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex gap-4">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/" className="font-medium hover:underline">Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/about" className="font-medium hover:underline">About</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Courses</NavigationMenuTrigger>
              <NavigationMenuContent className="p-4">
                <ul className="flex flex-col gap-2 min-w-[200px]">
                  <li><Link href="/courses" className="hover:underline">All Courses</Link></li>
                  <li><Link href="/courses/nextjs" className="hover:underline">IIT JAM</Link></li>
                  <li><Link href="/courses/uiux" className="hover:underline">GATE</Link></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/youtube" className="font-medium hover:underline">YouTube</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/contact" className="font-medium hover:underline">Contact</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </Button>
          )}

          <SignedOut>
            <Link href="/sign-in">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Sign Up</Button>
            </Link>
          </SignedOut>


          <SignedIn>
  <div className="flex items-center gap-4">
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="capitalize">
            {user?.firstName || "User"}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-2 w-56 shadow-lg rounded-md bg-popover text-popover-foreground">
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                href={`/${user?.firstName|| "user"}/dashboard`}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition"
                >
                  <User size={18} />
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/mocks"
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition"
                >
                  <FileText size={18} />
                  Mocks
                </Link>
              </li>
              <li>
             <button
             
      onClick={() => signOut()}
      
      className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition"
    >
      <LogOut size={18} />
      Logout
    </button>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>

    {/* Clerk Avatar */}
    <UserButton afterSignOutUrl="/" />
  </div>
</SignedIn>




          {/* Mobile Toggle */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="flex flex-col mt-4 gap-3 md:hidden">
          <Link href="/" className="font-medium hover:underline">Home</Link>
          <Link href="/about" className="font-medium hover:underline">About</Link>
          <Link href="/courses/react" className="font-medium hover:underline">React</Link>
          <Link href="/courses/nextjs" className="font-medium hover:underline">Next.js</Link>
          <Link href="/courses/uiux" className="font-medium hover:underline">UI/UX</Link>
          <Link href="/youtube" className="font-medium hover:underline">YouTube</Link>
          <Link href="/contact" className="font-medium hover:underline">Contact</Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar
