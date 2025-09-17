import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Script from "next/script";
import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthSync } from "@/components/AuthSync";
import { Toaster } from "@/components/ui/sonner";
import TopProgress from "@/components/TopProgress";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "Unfiltered IITIans",
  description: "A course platform for competitive exams",
  icons: { icon: "/logo.jpeg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inject theme script early to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    theme = systemDark ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthSync />
            <TopProgress /> 
            <Providers>{children}</Providers>
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
