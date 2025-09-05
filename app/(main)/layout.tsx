// app/(main)/layout.tsx
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Zilla_Slab, Poppins } from "next/font/google";
import BackgroundWrapper from "@/components/BackgroundWrapper";
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

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${zillaSlab.variable} ${poppins.variable}`}>
      {/* Navbar is fixed, so no need to wrap it in BackgroundWrapper */}
      <Navbar />  
      <BackgroundWrapper>
        <main className="font-body pt-16">{children}</main>
        <Footer />
      </BackgroundWrapper>
    </div>
  );
}