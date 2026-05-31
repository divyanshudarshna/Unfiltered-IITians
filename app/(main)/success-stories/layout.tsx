import { Metadata } from "next"
import { prisma } from "@/lib/prisma"

interface SuccessStoriesLayoutProps {
  readonly children: React.ReactNode
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const allStories = await prisma.studentSuccessStory.findMany({
      select: {
        approvalStatus: true,
        isApproved: true,
      },
    })

    const storiesCount = allStories.filter((story) => {
      const status = String((story as { approvalStatus?: string | null }).approvalStatus ?? "").toLowerCase()
      const isApproved = (story as { isApproved?: boolean | null }).isApproved

      if (status === "pending" || status === "rejected") return false
      if (status === "approved") return true

      // Legacy fallback: if status is missing/unknown, only hide when explicitly marked unapproved.
      return isApproved !== false
    }).length
    
    const description = `Read inspiring success stories from ${storiesCount} students who cracked IIT JEE with Unfiltered IITians. Get motivated and learn from their journey to achieve your IIT dream.`
    
    return {
      title: "Success Stories - IIT JEE Toppers - Unfiltered IITians",
      description: description,
      keywords: [
        "IIT JEE success stories",
        "IIT toppers",
        "JEE achievers",
        "student testimonials",
        "IIT preparation success",
        "engineering success stories",
        "JEE rank holders",
        "IIT coaching success",
        "unfiltered iitians students",
        "crack IIT JEE"
      ],
      openGraph: {
        title: "Success Stories - IIT JEE Achievers",
        description: description,
        type: "website",
        url: "/success-stories",
        siteName: "Unfiltered IITians",
        images: [
          {
            url: "/logo.jpeg",
            width: 1200,
            height: 630,
            alt: "IIT JEE Success Stories"
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: "Success Stories - IIT JEE Achievers",
        description: description,
        images: ["/logo.jpeg"]
      },
      alternates: {
        canonical: "/success-stories"
      }
    }
  } catch (error) {
    console.error("Error generating success stories metadata:", error)
    return {
      title: "Success Stories - Unfiltered IITians",
      description: "Read inspiring success stories from students who achieved their IIT dreams."
    }
  }
}

export default function SuccessStoriesLayout({ children }: SuccessStoriesLayoutProps) {
  return <>{children}</>
}
