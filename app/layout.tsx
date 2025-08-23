import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthSync } from "@/components/AuthSync";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { dark } from "@clerk/themes";
import { RouteLoaderProvider } from "@/components/RouteLoader";
import Script from "next/script"; // ✅ use Next.js Script


export const metadata: Metadata = {
  title: "Unfiltered IITIans",
  description: "A course platform for competitive exams",
  icons: {
    icon: "/logo.jpeg", // ✅ this auto-puts favicon into <head>
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans"> {/* default system font for admin too */}
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <RouteLoaderProvider>
              <AuthSync />
              {children}
              <Toaster />
            </RouteLoaderProvider>
          </ThemeProvider>
        </ClerkProvider>

        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}