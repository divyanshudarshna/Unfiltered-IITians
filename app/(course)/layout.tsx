import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";


export const metadata: Metadata = {
  title: "Course Dashboard",
  description: "Interactive learning platform",
};

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Completely clean layout with no header/footer */}
        {children}
      </body>
    </html>
  );
}