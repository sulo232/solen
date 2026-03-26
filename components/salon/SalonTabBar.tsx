"use client";

import { useEffect, useRef } from "react";

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
    <div className="sticky top-[57px] z-10 w-full bg-[rgba(250,246,239,.82)] dark:bg-s-dm-bg/80 backdrop-blur-[28px] saturate-[1.3] border-b border-s-ink/5 dark:border-white/5 py-0 px-4 md:px-8 mb-8 overflow-hidden pointer-events-auto">
      <div 
        ref={scrollContainerRef}
        className="flex items-center gap-6 overflow-x-auto scrollbar-hide snap-x pt-2"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              data-tab={tab.key}
              onClick={() => onTabClick(tab.key)}
              className={`
                whitespace-nowrap pb-3 text-sm font-semibold transition-all duration-200 snap-center
                ${isActive 
                  ? "text-s-coral border-b-2 border-s-coral" 
                  : "text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text border-b-2 border-transparent"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
