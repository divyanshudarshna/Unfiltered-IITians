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
  IconSettings,
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
import { IconLock } from "@tabler/icons-react";
import { NavSecondary } from "@/components/admin/nav-secondary";
import { NavUser } from "@/components/admin/nav-user";
import { GraduationCap, MailOpen, MessageSquare, Video, UserCheck } from "lucide-react";
import { useUserProfileContext } from "@/contexts/UserProfileContext";
import { hasPermission, type PermissionKey } from "@/lib/roleConfig";

const data = {
  navMain: [
    { title: "Dashboard", url: "/admin/dashboard", permission: "dashboard", icon: IconDashboard },
    { title: "Users", url: "/admin/users", permission: "users", icon: IconUsers },
    { title: "Transaction Stats", url: "/admin/stats", permission: "transaction_stats", icon: IconChartBar },
    {
      title: "Mocks",
      icon: IconTestPipe,
      submenu: [
        { title: "Manage Mocks", url: "/admin/mocks", permission: "mocks" },
        { title: "Manage Mock Bundles", url: "/admin/mockBundles", permission: "mock_bundles" },
      ],
    },
    {
      title: "Courses",
      icon: IconBook,
      submenu: [
        { title: "Manage Courses", url: "/admin/courses", permission: "courses" },
        { title: "Manage Details", url: "/admin/course-details", permission: "course_details" },
        { title: "Course Enrollments", url: "/admin/course-enrollments", permission: "course_enrollments" },
        { title: "Manage Announcements", url: "/admin/announcement", permission: "announcements" },
        { title: "Feedbacks", url: "/admin/feedbacks", permission: "feedbacks"},
      ],
    },
    { title: "Manage Instructors", url: "/admin/instructors", permission: "instructors", icon: UserCheck },
    { title: "Coupons", url: "/admin/coupons", permission: "coupons", icon: IconTicket },
    { title: "Free Materials", url: "/admin/materials", permission: "materials", icon: IconFolder },
    { title: "Success Stories", url: "/admin/successStories", permission: "success_stories", icon: IconStar },
    {
      title: "Sessions",
      icon: GraduationCap,
      submenu: [
        { title: "Manage Sessions", url: "/admin/sessions", permission: "sessions" },
        { title: "Session Enrollments", url: "/admin/session-enrollments", permission: "session_enrollments" },
        { title: "Testimonials", url: "/admin/sessions/testimonials", permission: "session_testimonials" },
      ],
    },
    { title: "Manage YouTube", url: "/admin/youtube", permission: "youtube", icon: Video },
    { title: "Testimonials", url: "/admin/testimonials", permission: "testimonials", icon: MessageSquare },
    { title: "Contacts", url: "/admin/contact-us", permission: "contacts", icon: IconAddressBook },
    { title: "Newsletter", url: "/admin/newsletter", permission: "newsletter", icon: MailOpen },
    { title: "FAQ", url: "/admin/faq", permission: "faq", icon: IconHelpCircle },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      permission: "settings",
      icon: IconSettings,
      actions: [
        { title: "Email Logs", url: "/admin/settings/emails" },
        { title: "Certificates", url: "/admin/settings/certificates" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});
  const [contactCount, setContactCount] = React.useState(0);
  const [feedbackCount, setFeedbackCount] = React.useState(0);
  const [instructorUnreadCount, setInstructorUnreadCount] = React.useState(0);
  const [successStoryUnreadCount, setSuccessStoryUnreadCount] = React.useState(0);
  const [access, setAccess] = React.useState<{ role: string; permissions: string[] } | null>(null);
  const { userProfile, clerkUser, getProfileImageUrl, isLoading } = useUserProfileContext();

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  React.useEffect(() => {
    fetch("/api/admin/roles/me")
      .then((response) => response.ok ? response.json() : null)
      .then((roleAccess) => setAccess(roleAccess))
      .catch(() => setAccess({ role: "STUDENT", permissions: [] }))
  }, [])

  // Fetch notification counts
  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [contactRes, feedbackRes, instructorRes, successStoryRes] = await Promise.all([
          fetch("/api/admin/contact-us/pending-count"),
          fetch("/api/admin/feedback/unread-count"),
          fetch("/api/admin/instructors/unread-count"),
          fetch("/api/admin/success-stories/unread-count"),
        ]);

        if (contactRes.ok) {
          const { count } = await contactRes.json();
          setContactCount(count || 0);
        } else {
          console.warn(`Contact count API returned ${contactRes.status}`);
        }

        if (feedbackRes.ok) {
          const { count } = await feedbackRes.json();
          setFeedbackCount(count || 0);
        } else {
          console.warn(`Feedback count API returned ${feedbackRes.status}`);
        }

        if (instructorRes.ok) {
          const { count } = await instructorRes.json();
          setInstructorUnreadCount(count || 0);
        } else {
          console.warn(`Instructor count API returned ${instructorRes.status}`);
        }

        if (successStoryRes.ok) {
          const { count } = await successStoryRes.json();
          setSuccessStoryUnreadCount(count || 0);
        } else {
          console.warn(`Success story count API returned ${successStoryRes.status}`);
        }
      } catch (error) {
        console.error("Error fetching notification counts:", error);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Create user data from context
  const userData = React.useMemo(() => {
    // Get the user's full name
    const fullName = userProfile?.name || 
      (clerkUser?.firstName && clerkUser?.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}` 
        : clerkUser?.firstName || clerkUser?.lastName || "Admin User");

    return {
      name: fullName,
      email: userProfile?.email || clerkUser?.primaryEmailAddress?.emailAddress || "admin@example.com",
      avatar: getProfileImageUrl() || clerkUser?.imageUrl || "/unf_logo.jpeg",
      isLoading,
    };
  }, [userProfile, clerkUser, getProfileImageUrl, isLoading]);

  const isAllowed = (permission?: string) =>
    access?.role === "ADMIN" ||
    (access !== null && permission !== undefined && hasPermission(access.permissions, permission as PermissionKey));

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
                        {/* Show red dot for Courses dropdown if there are unread feedbacks */}
                        {item.title === "Courses" && feedbackCount > 0 && (
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        )}
                      </div>
                      <IconChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openMenus[item.title] ? "rotate-180" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {openMenus[item.title] &&
                    item.submenu.map((sub, i) => {
                      const allowed = isAllowed(sub.permission)
                      return (
                        <SidebarMenuItem key={i}>
                          {allowed ? (
                            <SidebarMenuButton asChild className="pl-8">
                              <Link href={sub.url} className="flex items-center justify-between w-full">
                                <span>{sub.title}</span>
                                {sub.title === "Feedbacks" && feedbackCount > 0 && (
                                  <span className="ml-auto h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                                    {feedbackCount > 99 ? "99+" : feedbackCount}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          ) : (
                            <SidebarMenuButton asChild className="pl-8" tooltip={"These can be access by admin role only please contact admin for access"}>
                              <div className="flex items-center justify-between w-full cursor-not-allowed opacity-80">
                                <span className="flex items-center gap-2">
                                  <span>{sub.title}</span>
                                </span>
                                <IconLock className="w-4 h-4 text-red-500" />
                              </div>
                            </SidebarMenuButton>
                          )}
                        </SidebarMenuItem>
                      )
                    })}
                </>
              ) : (
                <SidebarMenuItem>
                  {isAllowed(item.permission) ? (
                    <SidebarMenuButton asChild>
                      <Link href={item.url || "#"} className="flex items-center gap-2 justify-between w-full">
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon className="w-4 h-4" />}
                          {item.title}
                        </div>
                        {/* Show badge for Contacts */}
                        {item.title === "Manage Instructors" && instructorUnreadCount > 0 && (
                          <span className="ml-auto h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                            {instructorUnreadCount > 99 ? "99+" : instructorUnreadCount}
                          </span>
                        )}
                        {item.title === "Contacts" && contactCount > 0 && (
                          <span className="ml-auto h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                            {contactCount > 99 ? "99+" : contactCount}
                          </span>
                        )}
                        {item.title === "Success Stories" && successStoryUnreadCount > 0 && (
                          <span className="ml-auto h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                            {successStoryUnreadCount > 99 ? "99+" : successStoryUnreadCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton tooltip={"These can be access by admin role only please contact admin for access"}>
                      <div className="flex items-center gap-2 justify-between w-full cursor-not-allowed opacity-80">
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon className="w-4 h-4" />}
                          {item.title}
                        </div>
                        <IconLock className="w-4 h-4 text-red-500" />
                      </div>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              )}
            </React.Fragment>
          ))}
        </SidebarMenu>

        <NavSecondary items={data.navSecondary.filter((item) => isAllowed(item.permission))} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
