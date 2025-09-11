// components/TopProgress.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { onProgressStart, startProgress } from "@/lib/progressBus";
import CustomProgress from "./CustomProgress";

export default function TopProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const fallbackRef = useRef<number | null>(null);
  const isLoadingRef = useRef(false);

  // Start logic (keeps idempotent)
  const start = () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setVisible(true);
    setProgress(10);

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 90;
        }
        return Math.min(prev + 10, 90);
      });
    }, 200);

    // safety fallback in case navigation never completes
    if (fallbackRef.current) window.clearTimeout(fallbackRef.current);
    fallbackRef.current = window.setTimeout(() => {
      complete();
    }, 10000); // 10s fallback (adjust if you want)
  };

  // Complete logic
  const complete = () => {
    if (!isLoadingRef.current) return;
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fallbackRef.current) {
      window.clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }

    setProgress(100);

    // let CSS transition run then hide
    window.setTimeout(() => {
      isLoadingRef.current = false;
      setVisible(false);
      setProgress(0);
    }, 200);
  };

  // subscribe to programmatic start events
  useEffect(() => {
    const off = onProgressStart(start);
    return () => off();
    // intentionally empty deps — we only want to subscribe once
  }, []);

  // Capture-phase global click listener - detects internal <a> clicks before Next's Link handler
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e instanceof MouseEvent)) return;
      // left click only, no modifiers
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // find closest anchor
      let el = e.target as HTMLElement | null;
      while (el && el.nodeName !== "A") el = el.parentElement;
      if (!el) return;
      const anchor = el as HTMLAnchorElement;
      const href = anchor.getAttribute("href");
      if (!href) return;

      // ignore external, mailto:, tel:, javascript:, target="_blank" etc.
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      try {
        const url = new URL(anchor.href, location.href);
        if (url.origin !== location.origin) return; // external
        // if same path+search -> probably hash-only navigation => ignore
        if (url.pathname === location.pathname && url.search === location.search) return;
        // Internal navigation will occur — start progress immediately
        startProgress();
      } catch {
        // ignore invalid urls
      }
    };

    document.addEventListener("click", onClick, true); // capture: true
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // complete when route actually changes
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // We purposely don't include isLoadingRef in deps; we check ref
    if (isLoadingRef.current) {
      complete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (fallbackRef.current) window.clearTimeout(fallbackRef.current);
      isLoadingRef.current = false;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[60] pointer-events-none">
      <CustomProgress value={progress} />
    </div>
  );
}
