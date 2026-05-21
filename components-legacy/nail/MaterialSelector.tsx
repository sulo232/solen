"use client";

import { Droplets, Layers, Sparkles, Gem, Hand } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NailMaterial } from "@/lib/types";

interface MaterialSelectorProps {
  value: NailMaterial | null;
  onChange: (material: NailMaterial) => void;
}

const MATERIALS: { value: NailMaterial; labelKey: string; descKey: string; icon: React.FC<{ className?: string; size?: number }> }[] = [
  { value: "gel", labelKey: "mat_gel", descKey: "mat_gel_desc", icon: Droplets },
  { value: "acrylic", labelKey: "mat_acrylic", descKey: "mat_acrylic_desc", icon: Layers },
  { value: "dip_powder", labelKey: "mat_dip_powder", descKey: "mat_dip_powder_desc", icon: Sparkles },
  { value: "polygel", labelKey: "mat_polygel", descKey: "mat_polygel_desc", icon: Gem },
  { value: "shellac", labelKey: "mat_shellac", descKey: "mat_shellac_desc", icon: Droplets },
  { value: "press_on", labelKey: "mat_press_on", descKey: "mat_press_on_desc", icon: Hand },
  { value: "natural", labelKey: "mat_natural", descKey: "mat_natural_desc", icon: Sparkles },
];

export default function MaterialSelector({ value, onChange }: MaterialSelectorProps) {
  const t = useTranslations("booking") as any;

  return (
    <div>
      <p className="text-sm font-medium text-s-ink mb-2">{t("nail_material_choose")}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MATERIALS.map(({ value: v, labelKey, descKey, icon: Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex items-start gap-2.5 p-3 rounded-[16px] border text-left transition-[border-color,background-color] duration-150 ${
              value === v
                ? "border-s-coral bg-s-coral/5 ring-1 ring-s-coral/30"
                : "border-s-ink/10 bg-[--raised] hover:border-s-coral/20"
            }`}
          >
            <Icon
              size={18}
              className={value === v ? "text-s-coral shrink-0 mt-0.5" : "text-s-ink/30 shrink-0 mt-0.5"}
            />
            <div>
              <span className={`text-sm font-medium block ${value === v ? "text-s-coral" : "text-s-ink"}`}>
                {t(labelKey)}
              </span>
              <span className="text-[11px] text-s-ink/40">{t(descKey)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
