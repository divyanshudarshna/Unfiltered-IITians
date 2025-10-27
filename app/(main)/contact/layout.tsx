import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch",
  description: "Contact Unfiltered IITians for course inquiries, support, or guidance. Reach out to our expert team for personalized assistance.",
  keywords: [
    "contact us",
    "course inquiry",
    "student support",
    "get in touch",
    "help desk",
    "customer service"
  ],
  openGraph: {
    title: "Contact Us - Get in Touch",
    description: "Contact our expert team for course inquiries and personalized assistance.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - Get in Touch",
    description: "Contact our expert team for course inquiries and assistance.",
  }
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}