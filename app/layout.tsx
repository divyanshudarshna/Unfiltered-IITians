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
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Unfiltered IITIans",
  description: "A course platform for competitive exams",
  icons: { icon: "/unf_logo.jpeg" },
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
                  var theme = localStorage.getItem('theme') || 'dark'; // default dark
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans bg-slate-900 text-slate-100">
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark" // default to dark
            enableSystem={false} // you can set true if you want system preference override
            disableTransitionOnChange
          >
            <AuthSync />
            <TopProgress /> 
            <Providers>{children}</Providers>

            {/* Custom Toaster */}
            <Toaster
              richColors
              toastOptions={{
                success: {
                  style: {
                    background: '#22c55e', // green background
                    color: '#ffffff',      // white text
                    fontWeight: 'bold',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444', // red background
                    color: '#ffffff',      // white text
                    fontWeight: 'bold',
                  },
                },
              }}
            />
          </ThemeProvider>
        </ClerkProvider>

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
        {/* ✅ Vercel Speed Insights */}
        <SpeedInsights />
        {/* ✅ Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
