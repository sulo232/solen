"use client";
import { cn } from "@/lib/utils";
import type { DiscoveryCategory } from "@/lib/types";

const HAIR_TEXTURES = [
  { value: null, label: "All" },
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
  { value: "protective", label: "Protective" },
  { value: "bald", label: "Bald" },
];

const BEARD_TYPES = [
  { value: null, label: "All" },
  { value: "full", label: "Full" },
  { value: "goatee", label: "Goatee" },
  { value: "stubble", label: "Stubble" },
  { value: "fade", label: "Fade" },
  { value: "line-up", label: "Line-up" },
];

interface PatternSelectorProps {
  category: DiscoveryCategory | null;
  selected: string | null;
  onSelect: (texture: string | null) => void;
}

export default function PatternSelector({ category, selected, onSelect }: PatternSelectorProps) {
  const options = category === "beard" ? BEARD_TYPES : HAIR_TEXTURES;
  // Only show for hair and beard categories
  if (category && !["hair", "beard"].includes(category)) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {options.map((opt) => (
        <button
          key={opt.value ?? "all"}
          onClick={() => onSelect(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors border",
            selected === opt.value
              ? "bg-s-coral text-white border-s-coral"
              : "bg-white dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border-s-ink/10 dark:border-white/10 hover:border-s-coral/30"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
