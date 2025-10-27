import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Courses - Your Learning Dashboard",
  description: "Access your enrolled courses, track progress, and continue your exam preparation journey. Manage your learning experience.",
  keywords: [
    "my courses",
    "student dashboard",
    "course progress",
    "enrolled courses",
    "learning dashboard"
  ],
  openGraph: {
    title: "My Courses - Your Learning Dashboard",
    description: "Access your enrolled courses and track your learning progress.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Courses - Your Learning Dashboard",
    description: "Access your enrolled courses and track progress.",
  }
};

export default function MyCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}