"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconDashboard,
  IconUsers,
  IconBook,
  IconFolder,
  IconStar,
  IconAddressBook,
  IconHelpCircle,
  IconTestPipe,
  IconChevronDown,
  IconChartBar,
  IconTicket,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavSecondary } from "@/components/admin/nav-secondary";
import { NavUser } from "@/components/admin/nav-user";
import { GraduationCap, MailOpen, MessageSquare, Video } from "lucide-react";

const data = {
  user: {
    name: "Raj Rabidas",
    email: "rajkumargautam890@gmail.com",
    avatar: "/avatars/raj.jpg",
  },
  navMain: [
    { title: "Dashboard", url: "/admin/dashboard", icon: IconDashboard },
    { title: "Users", url: "/admin/users", icon: IconUsers },
    { title: "Transaction Stats", url: "/admin/stats", icon: IconChartBar },
    {
      title: "Mocks",
      icon: IconTestPipe,
      submenu: [
        { title: "Manage Mocks", url: "/admin/mocks" },
        { title: "Manage Mock Bundles", url: "/admin/mockBundles" },
      ],
    },
    {
      title: "Courses",
      icon: IconBook,
      submenu: [
        { title: "Manage Courses", url: "/admin/courses" },
        { title: "Manage Details", url: "/admin/course-details" },
        { title: "Manage Announcements", url: "/admin/announcement" },
        { title: "Feedbacks", url: "/admin/feedbacks"},
      ],
    },
    { title: "Coupons", url: "/admin/general-coupons", icon: IconTicket },
    { title: "Free Materials", url: "/admin/materials", icon: IconFolder },
    { title: "Success Stories", url: "/admin/successStories", icon: IconStar },
    { title: "Sessions", url: "/admin/sessions", icon: GraduationCap },
    { title: "Manage YouTube", url: "/admin/youtube", icon: Video },
    { title: "Testimonials", url: "/admin/testimonials", icon: MessageSquare },
    { title: "Contacts", url: "/admin/contact-us", icon: IconAddressBook },
    { title: "Newsletter", url: "/admin/newsletter", icon: MailOpen },
    { title: "FAQ", url: "/admin/faq", icon: IconHelpCircle },
  ],
  navSecondary: [{ title: "Settings", url: "/admin/settings", icon: IconBook }],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5 my-2">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <Image
                  src="/unf_logo.jpeg"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
                />
                <span className="text-base font-semibold">Admin Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {data.navMain.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.submenu ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => toggleMenu(item.title)}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        {item.title}
                      </div>
                      <IconChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openMenus[item.title] ? "rotate-180" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {openMenus[item.title] &&
                    item.submenu.map((sub, i) => (
                      <SidebarMenuItem key={i}>
                        <SidebarMenuButton asChild className="pl-8">
                          <Link href={sub.url}>{sub.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={item.url || "#"} className="flex items-center gap-2">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </React.Fragment>
          ))}
        </SidebarMenu>

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
