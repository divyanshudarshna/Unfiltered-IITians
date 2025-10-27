import { Metadata } from "next"
import { prisma } from "@/lib/prisma"

interface MockStartLayoutProps {
  readonly children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const mock = await prisma.mockTest.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        description: true,
        difficulty: true,
        duration: true,
        questions: true,
        price: true,
        actualPrice: true,
        tags: true,
        status: true,
      }
    })

    if (!mock || mock.status !== "PUBLISHED") {
      return {
        title: "Mock Test Not Found - Unfiltered IITians",
        description: "The mock test you're looking for could not be found."
      }
    }

    const questionCount = Array.isArray(mock.questions) ? mock.questions.length : 0
    const duration = mock.duration || Math.round(questionCount * 3)
    const description = mock.description || `${mock.difficulty} level mock test with ${questionCount} questions. Duration: ${duration} minutes. Practice for IIT JEE preparation.`
    
    return {
      title: `${mock.title} - Mock Test - Unfiltered IITians`,
      description: description,
      keywords: [
        "IIT JEE mock test",
        mock.title,
        "JEE practice test",
        "mock exam",
        "IIT preparation",
        "engineering entrance",
        `${mock.difficulty} level`,
        `${questionCount} questions`,
        "test preparation",
        "physics chemistry mathematics",
        "unfiltered iitians",
        ...(mock.tags || [])
      ],
      openGraph: {
        title: `${mock.title} - Start Mock Test`,
        description: description,
        type: "website",
        url: `/mocks/${params.id}/start`,
        siteName: "Unfiltered IITians",
        images: [
          {
            url: "/logo.jpeg",
            width: 1200,
            height: 630,
            alt: `${mock.title} mock test`
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: `${mock.title} - ${questionCount} Questions`,
        description: description,
        images: ["/logo.jpeg"]
      },
      alternates: {
        canonical: `/mocks/${params.id}/start`
      }
    }
  } catch (error) {
    console.error("Error generating mock metadata:", error)
    return {
      title: "Mock Test - Unfiltered IITians",
      description: "Practice mock tests for IIT JEE preparation."
    }
  }
}

export default function MockStartLayout({ children }: MockStartLayoutProps) {
  return <>{children}</>
}