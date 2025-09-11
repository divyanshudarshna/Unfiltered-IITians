import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthSync } from "@/components/AuthSync";
import { Toaster } from "@/components/ui/sonner";
import { dark } from "@clerk/themes";
import TopProgress from "@/components/TopProgress";

import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unfiltered IITIans",
  description: "A course platform for competitive exams",
  icons: {
    icon: "/logo.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        
              <AuthSync />
              <TopProgress/>
              {children}
              <Toaster />
           
          </ThemeProvider>
        </ClerkProvider>

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
