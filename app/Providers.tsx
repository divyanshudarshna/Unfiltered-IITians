"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <ProgressBar
        height="3px"
        color="#9333ea"
        options={{ showSpinner: false }}
        shallowRouting
      />
      {children}
    </>
  );
}
