"use client"

import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function GlobalLoading() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    // Start loading with slight delay for smoother UX
    setIsLoading(true)
    timeout = setTimeout(() => {
      setIsLoading(false)
    }, 800) // Adjust this based on your average route time

    return () => clearTimeout(timeout)
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
