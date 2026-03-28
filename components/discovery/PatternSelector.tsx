"use client";
import { cn } from "@/lib/utils";
import type { DiscoveryCategory } from "@/lib/types";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("discover") as any;
  const options = category === "beard" ? BEARD_TYPES : HAIR_TEXTURES;
  // Only show for hair and beard categories
  if (category && !["hair", "beard"].includes(category)) return null;

  return (
    <div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
        {t("texture")}
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {options.map((opt) => (
          <button
            key={opt.value ?? "all"}
            aria-pressed={selected === opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              "px-3 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 border",
              selected === opt.value
                ? "border-s-coral bg-s-coral/[0.08] text-s-coral"
                : "border-s-ink/[0.07] dark:border-white/[0.07] text-s-ink/50 dark:text-s-dm-text/50 hover:border-s-coral/40"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
