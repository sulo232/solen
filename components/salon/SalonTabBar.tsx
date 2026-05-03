"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface SalonTabBarProps {
  activeTab: string;
  onTabClick: (tab: string) => void;
  tabs: { key: string; label: string }[];
}

export default function SalonTabBar({ activeTab, onTabClick, tabs }: SalonTabBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the tab bar to keep the active tab in view (especially on mobile)
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const activeElement = scrollContainerRef.current.querySelector(
      `button[data-tab="${activeTab}"]`
    );
    
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    }
  }, [activeTab]);

  return (
    <div className="sticky top-[57px] z-40 w-full bg-white border-b border-s-ink/[0.08] py-0 px-4 md:px-8 mb-8 overflow-hidden pointer-events-auto">
      <div 
        ref={scrollContainerRef}
        className="flex items-center gap-6 overflow-x-auto scrollbar-hide snap-x overscroll-x-contain pt-2"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              data-tab={tab.key}
              onClick={() => onTabClick(tab.key)}
              className={`
                relative whitespace-nowrap pb-3 min-h-[44px] flex items-end text-[14px] font-heading transition-colors duration-150 snap-center
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2
                ${isActive
                  ? "text-s-ink"
                  : "text-[#9F8A7E] hover:text-s-ink"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="salon-tab-indicator"
                  // Q52: 2px brand-color underline (post-Q64 `s-coral` resolves to
                  // brand-green #1B4D1B). 200ms ease per Q35 motion grammar.
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-s-coral"
                  transition={{ type: "tween", duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
