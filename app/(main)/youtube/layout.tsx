import { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Channel - Learn with Divyanshu",
  description: "Free educational videos for GATE, CSIR NET, PhD preparation. Expert tutorials, tips, and strategies from IIT alumni on YouTube.",
  keywords: [
    "educational YouTube channel",
    "GATE preparation videos",
    "CSIR NET tutorials",
    "PhD entrance videos",
    "free education videos",
    "competitive exam YouTube"
  ],
  openGraph: {
    title: "YouTube Channel - Learn with Divyanshu",
    description: "Free educational videos for competitive exam preparation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Channel - Learn with Divyanshu",
    description: "Free educational videos for competitive exam preparation.",
  }
};

export default function YouTubeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}