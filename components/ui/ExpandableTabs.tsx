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
}

export default function ExpandableTabs({ tabs, defaultTab }: ExpandableTabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 -mb-px",
              active === tab.id
                ? "border-teal text-teal"
                : "border-transparent text-dark/50 hover:text-dark",
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
