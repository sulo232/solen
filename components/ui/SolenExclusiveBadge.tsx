"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface SolenExclusiveBadgeProps {
  featureDescription: string;
  variant?: "inline" | "floating";
}

export default function SolenExclusiveBadge({
  featureDescription,
  variant = "inline",
}: SolenExclusiveBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className={`relative ${variant === "floating" ? "absolute z-10" : "inline-flex"}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((v) => !v)}
    >
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-gradient-to-r from-s-coral-500/20 to-s-coral-400/10 text-s-coral-700 dark:text-s-coral-300 px-1.5 py-0.5 rounded-full border border-s-coral-200/50 dark:border-s-coral-700/50 cursor-help whitespace-nowrap">
        <Sparkles size={10} />
        Nur bei Solen
      </span>
      {showTooltip && (
        <span className="absolute z-10 bg-s-ink text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[200px] -top-10 left-1/2 -translate-x-1/2 pointer-events-none">
          {featureDescription}
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
