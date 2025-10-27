import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Bundles - Comprehensive Test Packages",
  description: "Complete mock test bundles for GATE, CSIR NET, and PhD entrance exams. Multiple tests with detailed analysis and performance tracking.",
  keywords: [
    "mock test bundles",
    "GATE test series",
    "CSIR NET test packages",
    "PhD entrance test bundles",
    "competitive exam test series",
    "comprehensive mock tests"
  ],
  openGraph: {
    title: "Mock Bundles - Comprehensive Test Packages",
    description: "Complete mock test bundles with detailed analysis and performance tracking.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mock Bundles - Comprehensive Test Packages",
    description: "Complete mock test bundles for competitive exams.",
  }
};

export default function MockBundlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}