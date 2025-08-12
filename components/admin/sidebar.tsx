"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconDashboard,
  IconUsers,
  IconFileDescription,
  IconReceiptRefund,
  IconCheckupList,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,   // <--- Import SidebarProvider
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: IconDashboard },
  { title: "Users", url: "/admin/users", icon: IconUsers },
  { title: "Mock Tests", url: "/admin/mocks", icon: IconFileDescription },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: IconReceiptRefund },
  { title: "Mock Attempts", url: "/admin/mock-attempts", icon: IconCheckupList },
];

const user = {
  name: "Admin User",
  email: "admin@example.com",
  avatar: "/avatars/admin.jpg",
};

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <SidebarProvider> {/* Wrap everything here */}
      <Sidebar
        collapsible="offcanvas"
        {...props}
        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-2">
                <Link href="/admin/dashboard" className="flex items-center space-x-2">
                  <IconDashboard className="w-5 h-5" />
                  <span className="text-lg font-bold">Admin Panel</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map(({ title, url, icon: Icon }) => (
              <SidebarMenuItem key={title}>
                <SidebarMenuButton asChild>
                  <Link
                    href={url}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center p-4 border-t border-gray-200 dark:border-gray-700">
          <Image
  src={user.avatar}
  alt="Admin Avatar"
  width={40}     // 10 * 4 (Tailwind w-10 means 2.5rem = 40px)
  height={40}
  className="rounded-full mr-3"
  priority={true}
/>
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
