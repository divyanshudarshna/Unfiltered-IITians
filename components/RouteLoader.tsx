"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

type LoaderContextType = {
  loading: boolean
  showLoader: () => void
  hideLoader: () => void
}

const LoaderContext = createContext<LoaderContextType>({
  loading: false,
  showLoader: () => {},
  hideLoader: () => {},
})

export function RouteLoaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const apiRequests = useRef(0)

  // --- Navigation Loader ---
  useEffect(() => {
    if (!pathname) return
    setLoading(true)

    const minDelay = setTimeout(() => {
      if (apiRequests.current === 0) setLoading(false)
    }, 400)

    return () => clearTimeout(minDelay)
  }, [pathname])

  // --- Global Fetch Patch for API requests ---
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      apiRequests.current += 1
      setLoading(true)

      try {
        return await originalFetch(...args)
      } finally {
        apiRequests.current -= 1
        if (apiRequests.current === 0) {
          setTimeout(() => {
            if (apiRequests.current === 0) setLoading(false)
          }, 200)
        }
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  const showLoader = () => setLoading(true)
  const hideLoader = () => setLoading(false)

  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      <div
        className={`transition-opacity duration-200 ${
          loading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {children}
      </div>
      <RouteLoaderOverlay active={loading} />
    </LoaderContext.Provider>
  )
}

export function useRouteLoader() {
  return useContext(LoaderContext)
}

/* 🔥 Reusable Loader Overlay */
export function RouteLoaderOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
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
  )
}
