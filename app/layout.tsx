// app/layout.tsx
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/ThemeProvider"
import { AuthSync } from "@/components/AuthSync"
import GlobalLoading from "@/components/GlobalLoading"
import { Geist, Geist_Mono } from "next/font/google"
import { Zilla_Slab, Poppins } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner";

// Fonts setup (same as before)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const zillaSlab = Zilla_Slab({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Unfiltered IITIans",
  description: "A course platform for competitive exams",
  icons: {
    icon: "/logo.jpeg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${zillaSlab.variable} ${poppins.variable}`}
    >
      <link rel="icon" href="/logo.jpeg" type="image/jpeg" />
      <body className="font-body">
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthSync />
            {children}
            <Toaster />
            <GlobalLoading />
          </ThemeProvider>
        </ClerkProvider>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </body>
    </html>
  )
}
