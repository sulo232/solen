"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface ServiceCategoryFilterProps {
  categories: { key: string; count: number }[];
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  lang: string;
}

export default function ServiceCategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
  lang,
}: ServiceCategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic could be added here to keep the active item in view if needed
  
  return (
    <div className="relative w-full overflow-hidden mb-6">
      {/* Optional gradient fade masks for horizontal scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-s-bg-base dark:from-s-dm-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-s-bg-base dark:from-s-dm-bg to-transparent z-10 pointer-events-none" />

      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar px-6 py-2"
        style={{ scrollBehavior: "smooth" }}
      >
        <button
          onClick={() => onCategoryChange(null)}
          className={`shrink-0 px-3 py-1.5 rounded-pill text-xs font-heading font-bold uppercase tracking-[.06em] transition-all duration-200 ${
            activeCategory === null
              ? "bg-s-coral text-white scale-105"
              : "bg-s-bg-raised text-s-ink/60 border border-s-ink/[0.08] hover:border-s-ink/20 dark:bg-s-dm-surface dark:text-s-dm-text/60 dark:border-white/10 dark:hover:border-white/20"
          }`}
        >
          {lang === "de" ? "Alle" : "All"}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={`shrink-0 px-3 py-1.5 rounded-pill text-xs font-heading font-bold uppercase tracking-[.06em] transition-all duration-200 ${
              activeCategory === cat.key
                ? "bg-s-coral text-white scale-105"
                : "bg-s-bg-raised text-s-ink/60 border border-s-ink/[0.08] hover:border-s-ink/20 dark:bg-s-dm-surface dark:text-s-dm-text/60 dark:border-white/10 dark:hover:border-white/20"
            }`}
          >
            {cat.key} ({cat.count})
          </button>
        ))}
      </div>
    </div>
  );
}
