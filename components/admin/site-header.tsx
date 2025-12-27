"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: "contact" | "feedback"
  title: string
  message: string
  email: string
  createdAt: Date
  link: string
}

export function SiteHeader() {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setTotalCount(data.totalCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {totalCount > 9 ? "9+" : totalCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications ({totalCount})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} asChild>
                      <Link
                        href={notif.link}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className={`h-2 w-2 rounded-full ${notif.type === "contact" ? "bg-blue-500" : "bg-green-500"}`} />
                          <span className="font-medium text-sm">{notif.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-4">
                          {notif.message}
                        </p>
                        <span className="text-xs text-muted-foreground pl-4">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/contact-us" className="w-full text-center text-sm cursor-pointer">
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
