import { Metadata } from "next"
import { prisma } from "@/lib/prisma"

interface CourseLayoutProps {
  readonly children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        description: true,
        price: true,
        actualPrice: true,
        durationMonths: true,
      }
    })

    if (!course) {
      return {
        title: "Course Not Found - Unfiltered IITians",
        description: "The course you're looking for could not be found."
      }
    }

    const description = course.description || `Comprehensive course designed for IIT JEE preparation with ${course.durationMonths} months duration.`
    
    return {
      title: `${course.title} - Course - Unfiltered IITians`,
      description: description,
        keywords: [
        "IIT JEE course",
        course.title,
        "JEE preparation",
        "IIT coaching",
        "engineering entrance",
        "online course",
        `${course.durationMonths} months course`,
        "physics chemistry mathematics",
        "unfiltered iitians"
      ],
      openGraph: {
        title: `${course.title} - Enroll Now`,
        description: description,
        type: "website",
        url: `/courses/${params.id}`,
        siteName: "Unfiltered IITians",
        images: [
          {
            url: "/logo.jpeg",
            width: 1200,
            height: 630,
            alt: `${course.title} course`
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: `${course.title} - Enroll Now`,
        description: description,
        images: ["/logo.jpeg"]
      },
      alternates: {
        canonical: `/courses/${params.id}`
      }
    }
  } catch (error) {
    console.error("Error generating course metadata:", error)
    return {
      title: "Course - Unfiltered IITians",
      description: "Discover comprehensive courses for IIT JEE preparation."
    }
  }
}

export default function CourseLayout({ children }: CourseLayoutProps) {
  return <>{children}</>
}