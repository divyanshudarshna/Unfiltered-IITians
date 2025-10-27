import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Tests - Practice for GATE, CSIR NET & Competitive Exams",
  description: "Practice with authentic mock tests for GATE, CSIR NET, PhD entrance exams. Detailed analysis, performance tracking, and exam pattern simulation.",
  keywords: [
    "GATE mock tests",
    "CSIR NET practice tests",
    "PhD entrance mock exams",
    "competitive exam practice",
    "online mock tests",
    "exam simulation",
    "performance analysis"
  ],
  openGraph: {
    title: "Mock Tests - Practice for GATE, CSIR NET & Competitive Exams",
    description: "Practice with authentic mock tests and detailed performance analysis.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mock Tests - Practice for Competitive Exams",
    description: "Authentic mock tests with detailed performance analysis.",
  }
};

export default function MocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}