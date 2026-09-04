"use client";

// CSS transitions only — no framer-motion.

import { useState } from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface ExpandableTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  /** Controlled active-tab id. When provided, the parent owns the state. */
  activeTab?: string;
  /** Called when a tab is clicked. Required for controlled mode. */
  onTabChange?: (id: string) => void;
}

export default function ExpandableTabs({ tabs, defaultTab, activeTab, onTabChange }: ExpandableTabsProps) {
  const [internalActive, setInternalActive] = useState(defaultTab ?? tabs[0]?.id);
  const isControlled = activeTab !== undefined;
  const active = isControlled ? activeTab : internalActive;
  const setActive = (id: string) => {
    if (!isControlled) setInternalActive(id);
    onTabChange?.(id);
  };

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-s-border overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-200 border-b-2 -mb-px",
              active === tab.id
                ? "border-s-accent text-s-accent"
                : "border-transparent text-s-ink-2 hover:text-s-ink",
            ].join(" ")}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          style={{
            display: active === tab.id ? "block" : "none",
            opacity: active === tab.id ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
