import { Metadata } from "next"
import { prisma } from "@/lib/prisma"

interface MockBundleLayoutProps {
  readonly children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { bundleId: string } }): Promise<Metadata> {
  try {
    const bundle = await prisma.mockBundle.findUnique({
      where: { id: params.bundleId },
      select: {
        title: true,
        description: true,
        basePrice: true,
        discountedPrice: true,
        mockIds: true,
        status: true,
      }
    })

    if (!bundle || bundle.status !== "PUBLISHED") {
      return {
        title: "Mock Bundle Not Found - Unfiltered IITians",
        description: "The mock bundle you're looking for could not be found."
      }
    }

    const description = bundle.description || `Comprehensive mock test bundle with ${bundle.mockIds.length} practice tests for IIT JEE preparation.`
    const discountPercentage = bundle.discountedPrice && bundle.basePrice > bundle.discountedPrice
      ? Math.round(((bundle.basePrice - bundle.discountedPrice) / bundle.basePrice) * 100)
      : 0
    
    return {
      title: `${bundle.title} - Mock Bundle - Unfiltered IITians`,
      description: description,
      keywords: [
        "IIT JEE mock tests",
        bundle.title,
        "JEE practice tests",
        "mock test bundle",
        "IIT coaching",
        "engineering entrance",
        "test preparation",
        `${bundle.mockIds.length} mock tests`,
        "physics chemistry mathematics",
        "unfiltered iitians"
      ],
      openGraph: {
        title: `${bundle.title} - ${bundle.mockIds.length} Mock Tests`,
        description: description + (discountPercentage ? ` Get ${discountPercentage}% off!` : ""),
        type: "website",
        url: `/mockBundles/${params.bundleId}/mocks`,
        siteName: "Unfiltered IITians",
        images: [
          {
            url: "/logo.jpeg",
            width: 1200,
            height: 630,
            alt: `${bundle.title} mock bundle`
          }
        ]
      },
      twitter: {
        card: "summary_large_image",
        title: `${bundle.title} - ${bundle.mockIds.length} Mock Tests`,
        description: description,
        images: ["/logo.jpeg"]
      },
      alternates: {
        canonical: `/mockBundles/${params.bundleId}/mocks`
      }
    }
  } catch (error) {
    console.error("Error generating mock bundle metadata:", error)
    return {
      title: "Mock Bundle - Unfiltered IITians",
      description: "Discover comprehensive mock test bundles for IIT JEE preparation."
    }
  }
}

export default function MockBundleLayout({ children }: MockBundleLayoutProps) {
  return <>{children}</>
}