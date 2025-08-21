"use client"

import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

type RouteLoaderContextType = {
  loading: boolean
}

const RouteLoaderContext = createContext<RouteLoaderContextType>({
  loading: false,
})

export function RouteLoaderProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  // Stop loader once route changes
useEffect(() => {
  if (loading) setLoading(false)
}, [pathname, loading])

  // Intercept all link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("http") || href.startsWith("#")) return

      // ✅ Prevent loading if navigating to the same route
      if (href === pathname) return  

      e.preventDefault()
      setLoading(true)
      router.push(href)
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [router, pathname])

  return (
    <RouteLoaderContext.Provider value={{ loading }}>
      {/* Page content */}
      <div
        className={`${
          loading ? "opacity-0 pointer-events-none" : "opacity-100"
        } transition-opacity duration-200`}
      >
        {children}
      </div>

      {/* Glassy loader overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="route-loader"
            className="fixed inset-0 z-[9999] flex items-center justify-center 
                       bg-background/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </RouteLoaderContext.Provider>
  )
}

export function useRouteLoader() {
  return useContext(RouteLoaderContext)
}
