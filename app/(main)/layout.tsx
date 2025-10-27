import React from "react";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Zilla_Slab, Poppins } from "next/font/google";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import Providers from "../Providers";

export const metadata: Metadata = {
  title: {
    default: "Unfiltered IITians - IIT-JAM, GATE-BT & CUET-PG Coaching by Divyanshu Darshna",
    template: "%s | Unfiltered IITians"
  },
  description: "Master IIT-JAM, GATE-BT & CUET-PG with expert guidance from Divyanshu Darshna at Unfiltered IITians. IIT JAM qualified instructor providing comprehensive coaching for masters course preparation in IIT.",
  keywords: [
    "Divyanshu Darshna",
    "Divyanshu Darshana",
    "IIT-JAM coaching Divyanshu",
    "GATE-BT Divyanshu Darshna", 
    "CUET-PG coaching Divyanshu",
    "Divyanshu IIT coaching",
    "courses by Divyanshu Darshna",
    "IIT-JAM preparation",
    "GATE-BT courses",
    "CUET-PG preparation", 
    "masters course IIT preparation",
    "competitive exam preparation",
    "physics chemistry mathematics",
    "biotechnology coaching",
    "mock tests",
    "online coaching",
    "unfiltered iitians"
  ],
  authors: [{ name: "Divyanshu Darshna" }, { name: "Unfiltered IITians Team" }],
  creator: "Divyanshu Darshna",
  publisher: "Unfiltered IITians",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Unfiltered IITians",
    title: "Unfiltered IITians - IIT-JAM, GATE-BT & CUET-PG Coaching by Divyanshu Darshna",
    description: "Master IIT-JAM, GATE-BT & CUET-PG with expert guidance from Divyanshu Darshna. Masters course preparation in IIT.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@DivyanshuDarshna",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const zillaSlab = Zilla_Slab({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default function MainLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className={`${zillaSlab.variable} ${poppins.variable}`}>
      {/* Providers is client-only, but Navbar/Footer/BackgroundWrapper stay outside */}
      <Navbar />

      <BackgroundWrapper>
        <Providers>
          <main className="font-body pt-16">{children}</main>
        </Providers>
        <Footer />
      </BackgroundWrapper>
    </div>
  );
}
