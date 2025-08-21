import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthSync } from "@/components/AuthSync";
import { Geist, Geist_Mono } from "next/font/google";
import { Zilla_Slab, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { dark } from "@clerk/themes";
import { RouteLoaderProvider } from "@/components/RouteLoader";
import Script from "next/script"; // ✅ use Next.js Script


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
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

export const metadata: Metadata = {
  title: "Unfiltered IITIans",
  description: "A course platform for competitive exams",
  icons: {
    icon: "/logo.jpeg", // ✅ this auto-puts favicon into <head>
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${zillaSlab.variable} ${poppins.variable}`}
    >
      <body className="font-body">
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <RouteLoaderProvider>
              <AuthSync />
              {children}
       
              <Toaster />
            </RouteLoaderProvider>
          </ThemeProvider>
        </ClerkProvider>

        {/* ✅ Proper way: Next.js Script */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
