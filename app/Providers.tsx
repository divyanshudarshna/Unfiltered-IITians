"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { ReactNode } from "react";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

export default function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <ProgressBar
        height="3px"
        color="#9333ea"
        options={{ showSpinner: false }}
        shallowRouting
      />
      <UserProfileProvider>
        {children}
      </UserProfileProvider>
    </>
  );
}
