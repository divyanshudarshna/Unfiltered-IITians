'use client'

import { Button } from "@/components/ui/button"
import { Ghost } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-background text-foreground">
      <div className="bg-muted rounded-full p-4 mb-6 shadow-sm">
        <Ghost className="w-10 h-10 text-muted-foreground" />
      </div>

      <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>

      <Button asChild>
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  )
}
