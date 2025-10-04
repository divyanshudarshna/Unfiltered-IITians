"use client";

import { Button } from "@/components/ui/button";

interface ScrollButtonProps {
  discountPercentage: number;
}

export function ScrollToButton({ discountPercentage }: ScrollButtonProps) {
  return (
    <div className="mt-6">
      <Button
        onClick={() => {
          document.getElementById('purchase-section')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
        </svg>
        Purchase Bundle & Save {discountPercentage > 0 ? `${discountPercentage}%` : 'Big'}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </Button>
    </div>
  );
}