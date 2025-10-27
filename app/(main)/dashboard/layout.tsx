import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Performance Overview",
  description: "View your learning analytics, mock test performance, course progress, and achievements in your personalized dashboard.",
  keywords: [
    "student dashboard",
    "performance analytics",
    "learning progress",
    "mock test results",
    "academic performance"
  ],
  openGraph: {
    title: "Dashboard - Performance Overview",
    description: "View your learning analytics and performance in your personalized dashboard.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard - Performance Overview",
    description: "View your learning analytics and performance.",
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}