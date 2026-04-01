"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

export default function Providers({ children }: Readonly<{ children: ReactNode }>) {
  // Create a QueryClient instance per component instance
  // This ensures each user gets their own cache and prevents memory leaks
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: How long data is considered fresh (no refetch)
            staleTime: 60 * 1000, // 60 seconds
            // Cache time: How long unused data stays in cache
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            // Retry failed requests
            retry: 1,
            // Don't refetch on window focus in dev (can be annoying)
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            // Refetch on reconnect
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProgressBar
        height="3px"
        color="#9333ea"
        options={{ showSpinner: false }}
        shallowRouting
      />
      <UserProfileProvider>
        {children}
      </UserProfileProvider>
    </QueryClientProvider>
  );
}
