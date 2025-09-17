"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useIsHydrated } from "@/hooks/useIsHydrated"; // reusable hook

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const hydrated = useIsHydrated();

  if (!hydrated) {
    // Prevent hydration mismatch by delaying render until client is ready
    return null;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
