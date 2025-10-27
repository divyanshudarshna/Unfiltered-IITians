import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Profile - User Account - Unfiltered IITians",
  description: "Manage your profile, view your progress, and update account settings. Track your IIT JEE preparation journey with Unfiltered IITians.",
  keywords: [
    "user profile",
    "account settings",
    "progress tracking",
    "IIT JEE preparation",
    "student dashboard", 
    "learning progress",
    "test scores",
    "course enrollment",
    "unfiltered iitians"
  ],
  openGraph: {
    title: "Profile - User Account",
    description: "Manage your profile and track your IIT JEE preparation progress.",
    type: "website",
    url: "/profile",
    siteName: "Unfiltered IITians",
    images: [
      {
        url: "/logo.jpeg", 
        width: 1200,
        height: 630,
        alt: "User Profile"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Profile - User Account",
    description: "Manage your profile and track your IIT JEE preparation progress.",
    images: ["/logo.jpeg"]
  },
  alternates: {
    canonical: "/profile"
  }
}

interface ProfileLayoutProps {
  readonly children: React.ReactNode
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return <>{children}</>
}