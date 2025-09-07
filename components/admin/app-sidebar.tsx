"use client"

import * as React from "react"
import {
  IconDashboard,
  IconUsers,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconReport,
  IconSearch,
  IconSettings,
  IconSpeakerphone,
  IconMessage,
  IconStar,
  IconAddressBook,
  IconHelpCircle,
  IconBook,
  IconTestPipe,
} from "@tabler/icons-react"
import Link from "next/link"
import { NavMain } from "@/components/admin/nav-main"
import { NavSecondary } from "@/components/admin/nav-secondary"
import { NavUser } from "@/components/admin/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Raj Rabidas",
    email: "rajkumargautam890@gmail.com",
    avatar: "/avatars/raj.jpg",
  },
  navMain: [
    { title: "Dashboard", url: "/admin/dashboard", icon: IconDashboard },
    { title: "Users", url: "/admin/users", icon: IconUsers },
    { title: "Mocks", url: "/admin/mocks", icon: IconTestPipe },
    { title: "Courses", url: "/admin/courses", icon: IconBook },
    { title: "Announcements", url: "/admin/announcement", icon: IconSpeakerphone },
    { title: "Feedbacks", url: "/admin/feedbacks", icon: IconMessage },
    { title: "Testimonials", url: "/admin/testimonials", icon: IconStar },
    { title: "Contacts", url: "/admin/contact-us", icon: IconAddressBook },
    { title: "FAQ", url: "/admin/faq", icon: IconHelpCircle },
  ],
  navSecondary: [
    { title: "Settings", url: "/admin/settings", icon: IconSettings },
    { title: "Help", url: "/admin/help", icon: IconHelp },
    { title: "Search", url: "/admin/search", icon: IconSearch },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >  
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Admin Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}