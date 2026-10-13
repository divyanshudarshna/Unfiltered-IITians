"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useIsHydrated } from "@/hooks/useIsHydrated"; // reusable hook

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const hydrated = useIsHydrated();
  const pathname = usePathname();
  // Route overrides never write to the saved theme preference. Dialogs and
  // portals inherit the document theme too, including on client navigation.
  const routeTheme = pathname === "/admin" || pathname?.startsWith("/admin/")
    ? "dark"
    : /^\/mocks\/[^/]+\/attempt\/[^/]+\/?$/.test(pathname ?? "") ? "light" : undefined;

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
      forcedTheme={routeTheme ?? props.forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
