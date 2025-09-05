"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { ReactNode } from "react";

export default function BackgroundWrapper({ children }: { children: ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // spotlight effect following cursor
  const spotlight = useTransform(
    [mouseX, mouseY],
    ([x, y]) =>
      `radial-gradient(600px at ${x}px ${y}px, rgba(120,119,198,0.15), transparent 80%)`
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white dark:bg-black transition-colors duration-500">
      {/* Grid background */}
<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,100,100,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,100,100,0.05)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,rgba(200,200,200,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(200,200,200,0.06)_1px,transparent_1px)]" />

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/60 via-transparent to-slate-200/40 dark:from-slate-900/60 dark:via-transparent dark:to-slate-950/40 pointer-events-none" />

      {/* Spotlight that follows mouse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: spotlight }}
        onMouseMove={(e) => {
          mouseX.set(e.clientX);
          mouseY.set(e.clientY);
        }}
      />

      {/* Main content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
