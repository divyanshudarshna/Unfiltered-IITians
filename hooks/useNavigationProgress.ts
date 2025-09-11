"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function useNavigationProgress() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setProgress(20);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    };

    handleStart();

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          handleComplete();
          return 80;
        }
        return prev + 10;
      });
    }, 150);

    return () => {
      clearInterval(progressInterval);
    };
  }, [pathname, searchParams]);

  return { isLoading, progress };
}