"use client";

import { Scissors, Sparkles, Users } from "lucide-react";
import type { DiscoveryContentType } from "@/lib/types";

interface SourceBadgeProps {
  contentType: DiscoveryContentType;
  className?: string;
}

const BADGE_CONFIG: Record<DiscoveryContentType, { label: string; bg: string; icon: React.ReactNode }> = {
  tiktok: {
    label: "TikTok",
    bg: "bg-s-ink/70 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.19 8.19 0 004.76 1.52V6.78a4.83 4.83 0 01-1-.09z" />
      </svg>
    ),
  },
  salon: {
    label: "Salon",
    bg: "bg-s-coral/80 text-white",
    icon: <Scissors size={10} />,
  },
  curated: {
    label: "Inspo",
    bg: "bg-s-plum/80 text-white",
    icon: <Sparkles size={10} />,
  },
  user: {
    label: "Community",
    bg: "bg-s-blue/80 text-white",
    icon: <Users size={10} />,
  },
};

export default function SourceBadge({ contentType, className = "" }: SourceBadgeProps) {
  const config = BADGE_CONFIG[contentType] ?? BADGE_CONFIG.curated;

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-pill backdrop-blur-sm font-medium ${config.bg} ${className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
