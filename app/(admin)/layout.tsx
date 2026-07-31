"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { toast } from "sonner";

import { AppSidebar } from "@/components/admin/app-sidebar";
import { SiteHeader } from "@/components/admin/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { getPermissionForPath } from "@/lib/roleConfig";

// Configure Geist fonts specifically for admin
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [access, setAccess] = React.useState<{ role: string; permissions: string[] } | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/admin/roles/me")
      .then((response) => response.ok ? response.json() : null)
      .then((roleAccess) => setAccess(roleAccess))
      .catch(() => setAccess({ role: "STUDENT", permissions: [] }));
  }, [isLoaded, user]);

  useEffect(() => {
    if (!access || !pathname) return;
    const permission = getPermissionForPath(pathname);
    const allowed = access.role === "ADMIN" || (permission !== null && access.permissions.includes(permission));
    if (!allowed) {
      toast.error("You don't have permission to access this page.");
      router.replace("/");
    }
  }, [access, pathname, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-3 border-primary/60 border-t-primary rounded-full animate-spin"></div>
          <div className="text-center space-y-1">
            <p className="font-medium text-foreground">Admin Portal</p>
            <p className="text-sm text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserProfileProvider>
      <div className={`${geistSans.variable} ${geistMono.variable} admin-fonts`}>
        <SidebarProvider
          style={{
            "--sidebar-width": "280px",
            "--header-height": "64px",
          } as React.CSSProperties}
        >
          <AppSidebar variant="inset" />
          <SidebarInset className="min-w-0">
            <SiteHeader />
            <main className="flex flex-1 flex-col p-6 bg-muted/10 min-h-screen w-full min-w-0 overflow-x-clip">
             
                {children}
         
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </UserProfileProvider>
  );
}
