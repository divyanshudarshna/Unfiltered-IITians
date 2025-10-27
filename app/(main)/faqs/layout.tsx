import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs - Frequently Asked Questions",
  description: "Find answers to common questions about our courses, mock tests, exam preparation strategies, and platform features.",
  keywords: [
    "FAQ",
    "frequently asked questions",
    "course information",
    "exam preparation help",
    "platform guide",
    "student support"
  ],
  openGraph: {
    title: "FAQs - Frequently Asked Questions",
    description: "Find answers to common questions about courses and exam preparation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQs - Frequently Asked Questions",
    description: "Find answers to common questions about courses and exam preparation.",
  }
};

export default function FAQsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}