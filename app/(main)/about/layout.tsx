import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Divyanshu Darshna - IIT-JAM, GATE-BT & CUET-PG Expert Mentor",
  description: "Meet Divyanshu Darshna, IIT JAM qualified expert and founder of Unfiltered IITians, helping thousands of students master IIT-JAM, GATE-BT & CUET-PG through proven coaching strategies for masters course preparation.",
  keywords: [
    "Divyanshu Darshna",
    "Divyanshu Darshana",
    "about Divyanshu Darshna",
    "IIT-JAM qualified Divyanshu",
    "GATE-BT expert Divyanshu",
    "CUET-PG mentor Divyanshu",
    "Divyanshu IIT mentor",
    "founder Unfiltered IITians",
    "competitive exam mentor",
    "masters course preparation expert",
    "biotechnology expert",
    "IIT coaching instructor",
    "student success mentor"
  ],
  openGraph: {
    title: "About Divyanshu Darshna - IIT-JAM, GATE-BT & CUET-PG Expert Mentor",
    description: "Meet Divyanshu Darshna, IIT JAM qualified expert and founder of Unfiltered IITians, helping thousands master IIT-JAM, GATE-BT & CUET-PG.",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Divyanshu Darshna - IIT-JAM, GATE-BT & CUET-PG Expert Mentor",
    description: "IIT JAM qualified expert helping thousands master IIT-JAM, GATE-BT & CUET-PG for masters course preparation.",
  }
};

export default function AboutLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}