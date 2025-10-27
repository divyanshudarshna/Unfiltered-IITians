import { Metadata } from "next";

export const metadata: Metadata = {
  title: "IIT-JAM, GATE-BT & CUET-PG Courses by Divyanshu Darshna - Masters Preparation",
  description: "Master IIT-JAM, GATE-BT & CUET-PG with comprehensive courses designed by Divyanshu Darshna. Expert coaching for masters course preparation in IIT with proven strategies, mock tests, and study materials.",
  keywords: [
    "Divyanshu Darshna courses",
    "Divyanshu Darshana courses",
    "IIT-JAM courses Divyanshu",
    "GATE-BT courses Divyanshu",
    "CUET-PG courses Divyanshu",
    "courses by Divyanshu Darshna",
    "Divyanshu IIT coaching courses",
    "IIT-JAM preparation courses",
    "GATE-BT physics courses",
    "CUET-PG chemistry courses", 
    "masters course IIT preparation",
    "biotechnology courses",
    "competitive exam courses",
    "online IIT coaching",
    "mock tests courses"
  ],
  openGraph: {
    title: "IIT-JAM, GATE-BT & CUET-PG Courses by Divyanshu Darshna - Masters Preparation",
    description: "Master IIT-JAM, GATE-BT & CUET-PG with comprehensive courses designed by Divyanshu Darshna. Expert coaching for masters course preparation in IIT.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IIT-JAM, GATE-BT & CUET-PG Courses by Divyanshu Darshna",
    description: "Master IIT-JAM, GATE-BT & CUET-PG with comprehensive courses designed by expert instructor Divyanshu Darshna.",
  }
};

export default function CoursesLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <>{children}</>;
}