// components/CustomProgress.tsx
"use client";

import React from "react";

interface CustomProgressProps {
  value: number;
  className?: string;
}

export default function CustomProgress({ value, className = "" }: CustomProgressProps) {
  return (
    <div className={`w-full bg-gray-100 dark:bg-gray-950 rounded-b-md h-1.5 overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-purple-500 dark:from-purple-600 dark:to-purple-500 transition-all duration-150 ease-out relative shadow-md shadow-purple-500/30"
        style={{ width: `${value}%` }}
        aria-hidden
      >
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12 animate-shine" />
      </div>
    </div>
  );
}
