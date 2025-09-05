import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/ThemeProvider"
import { AuthSync } from "@/components/AuthSync"

import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { dark } from "@clerk/themes"
import { RouteLoaderProvider, RouteLoaderOverlay } from "@/components/RouteLoader"
import Script from "next/script"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Unfiltered IITIans",
  description: "A course platform for competitive exams",
  icons: {
    icon: "/logo.jpeg",
  },
}

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
            <RouteLoaderProvider>
              <AuthSync />

              {/* 🔥 Suspense fallback reuses the same loader */}
              <Suspense fallback={<RouteLoaderOverlay active={true} />}>
                {children}
              </Suspense>

              <Toaster />
            </RouteLoaderProvider>
          </ThemeProvider>
        </ClerkProvider>

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
