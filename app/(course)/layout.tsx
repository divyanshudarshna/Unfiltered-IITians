import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Course Dashboard",
  description: "Interactive learning platform",
};

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} font-sans h-screen w-screen`}>
      {/* Wrap with SidebarProvider to enable sidebar functionality */}
      <SidebarProvider>
        {/* Make this the flex row container for sidebar + main content */}
        <div className="flex h-full w-full">
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
}
