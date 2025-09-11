"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import CustomProgress from "@/components/CustomProgress";

export default function ProgressProvider() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let completeTimeout: NodeJS.Timeout;

    const startProgress = () => {
      setIsLoading(true);
      setProgress(10);

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
    };

    const completeProgress = () => {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    };

    startProgress();

    // Complete after max 3 seconds (fallback)
    const fallbackTimeout = setTimeout(completeProgress, 3000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
      clearTimeout(fallbackTimeout);
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[60]"> {/* Higher z-index than navbar */}
      <CustomProgress value={progress} />
    </div>
  );
}