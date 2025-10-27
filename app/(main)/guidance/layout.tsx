import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guidance Sessions - Personalized Mentorship",
  description: "Book one-on-one guidance sessions with IIT experts. Get personalized mentorship for GATE, CSIR NET, PhD entrance exam preparation.",
  keywords: [
    "guidance sessions",
    "one-on-one mentorship",
    "personal mentor",
    "IIT expert guidance",
    "career counseling",
    "exam strategy"
  ],
  openGraph: {
    title: "Guidance Sessions - Personalized Mentorship",
    description: "Book one-on-one guidance sessions with IIT experts for personalized mentorship.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guidance Sessions - Personalized Mentorship",
    description: "One-on-one guidance sessions with IIT experts.",
  }
};

export default function GuidanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}