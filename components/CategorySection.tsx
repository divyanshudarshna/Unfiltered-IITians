// components/materials/CategorySection.tsx
"use client";

import React, { useState } from "react";
import MaterialCard from "./MaterialCard";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CategorySection({ category }: { category: { id: string; name: string; materials: any[] } }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="bg-card/50 backdrop-blur-sm rounded-2xl border border-primary/10 p-6 shadow-lg transition-all duration-300 hover:shadow-primary/10 hover:shadow-xl">
      {/* Category Header with toggle functionality */}
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/70 rounded-full"></div>
          <div>
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              {category.name}
            </h3>
            {/* optional category description could go here */}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
            {category.materials.length} {category.materials.length === 1 ? 'item' : 'items'}
          </div>
          <button className="p-1 rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Animated expand/collapse section */}
      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {category.materials.map((m) => (
            <MaterialCard key={m.id} material={m} />
          ))}
        </div>
      </div>

      {/* Empty state (if needed) */}
      {category.materials.length === 0 && isExpanded && (
        <div className="text-center py-8 text-muted-foreground italic">
          No materials available in this category
        </div>
      )}
    </section>
  );
}