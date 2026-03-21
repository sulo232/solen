"use client";

import { Droplets, Layers, Sparkles, Gem, Hand } from "lucide-react";
import type { NailMaterial } from "@/lib/types";

interface MaterialSelectorProps {
  value: NailMaterial | null;
  onChange: (material: NailMaterial) => void;
}

const MATERIALS: { value: NailMaterial; label: string; desc: string; icon: React.FC<{ className?: string; size?: number }> }[] = [
  { value: "gel", label: "Gel", desc: "Langlebig, glänzend", icon: Droplets },
  { value: "acrylic", label: "Acryl", desc: "Robust, formbar", icon: Layers },
  { value: "dip_powder", label: "Dip Powder", desc: "Leicht, haltbar", icon: Sparkles },
  { value: "polygel", label: "Polygel", desc: "Hybrid, flexibel", icon: Gem },
  { value: "shellac", label: "Shellac", desc: "Dünn, schonend", icon: Droplets },
  { value: "press_on", label: "Press-On", desc: "Sofort aufklebbar", icon: Hand },
  { value: "natural", label: "Natur", desc: "Nur Pflege & Lack", icon: Sparkles },
];

export default function MaterialSelector({ value, onChange }: MaterialSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2">Material wählen</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MATERIALS.map(({ value: v, label, desc, icon: Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex items-start gap-2.5 p-3 rounded-card border text-left transition-all ${
              value === v
                ? "border-s-coral bg-s-coral/5 dark:bg-s-coral/10 ring-1 ring-s-coral/30"
                : "border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface hover:border-s-coral/20"
            }`}
          >
            <Icon
              size={18}
              className={value === v ? "text-s-coral shrink-0 mt-0.5" : "text-s-ink/30 dark:text-s-dm-text/30 shrink-0 mt-0.5"}
            />
            <div>
              <span className={`text-sm font-medium block ${value === v ? "text-s-coral" : "text-s-ink dark:text-s-dm-text"}`}>
                {label}
              </span>
              <span className="text-[11px] text-s-ink/40 dark:text-s-dm-text/40">{desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
