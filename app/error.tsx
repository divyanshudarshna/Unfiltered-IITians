'use client'

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"
import Link from "next/link"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // console.error("App error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center bg-background text-foreground">
      <div className="bg-destructive/10 text-destructive rounded-full p-4 mb-6">
        <AlertTriangle className="w-10 h-10" />
      </div>

      <h2 className="text-3xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        We encountered an unexpected error. You can try refreshing the page or go back to the homepage.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => reset()} className="w-full sm:w-auto">
          Try Again
        </Button>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  )
}
