// app/(admin)/layout.tsx
'use client';

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SiteHeader } from "@/components/admin/site-header";
import { SidebarInset } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "280px",
          "--header-height": "64px",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col w-full">
          <SiteHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}