import { Metadata } from "next"
import { prisma } from "@/lib/prisma"

interface SuccessStoriesLayoutProps {
  readonly children: React.ReactNode
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const storiesCount = await prisma.studentSuccessStory.count()
    
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