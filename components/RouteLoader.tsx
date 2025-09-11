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

  // Navigation Loader
  useEffect(() => {
    if (!pathname) return
    setLoading(true)
    const minDelay = setTimeout(() => {
      if (apiRequests.current === 0) setLoading(false)
    }, 300) // shorter delay
    return () => clearTimeout(minDelay)
  }, [pathname])

  // Patch fetch globally
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
          }, 100) // tiny debounce
        }
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return (
    <LoaderContext.Provider
      value={{
        loading,
        showLoader: () => setLoading(true),
        hideLoader: () => setLoading(false),
      }}
    >
      {children}
      <RouteProgressBar active={loading} />
    </LoaderContext.Provider>
  )
}

export function useRouteLoader() {
  return useContext(LoaderContext)
}

/* Modern Top Progress Bar */
export function RouteProgressBar({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="progress-bar"
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-lg"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ transformOrigin: "0% 50%" }}
        />
      )}
    </AnimatePresence>
  )
}
