"use client"

import { Toaster } from "sonner"

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        classNames: {
          success: "border border-green-500 text-green-600 bg-green-50",
          error: "border border-red-500 text-red-600 bg-red-50",
        },
      }}
    />
  )
}
