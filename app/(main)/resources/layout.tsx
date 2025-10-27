import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Resources - Study Materials for Competitive Exams",
  description: "Access free study materials, notes, PDFs, and video tutorials for GATE, CSIR NET, PhD entrance exams. Quality resources from IIT experts.",
  keywords: [
    "free study materials",
    "GATE free resources",
    "CSIR NET free notes",
    "PhD entrance study material",
    "free competitive exam resources",
    "study notes PDF",
    "educational resources"
  ],
  openGraph: {
    title: "Free Resources - Study Materials for Competitive Exams",
    description: "Access free study materials, notes, and video tutorials for competitive exams.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Resources - Study Materials",
    description: "Quality free study materials for competitive exams.",
  }
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}