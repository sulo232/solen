"use client";
import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DiscoveryCategory, DiscoveryGender } from "@/lib/types";
import CategoryPills from "./CategoryPills";
import GenderToggle from "./GenderToggle";
import PatternSelector from "./PatternSelector";
import StyleNamePills from "./StyleNamePills";

interface FilterDrawerProps {
  category: DiscoveryCategory | "all";
  gender: DiscoveryGender | "all";
  texture: string | null;
  style: string | null;
  onCategoryChange: (c: DiscoveryCategory | "all") => void;
  onGenderChange: (g: DiscoveryGender | "all") => void;
  onTextureChange: (t: string | null) => void;
  onStyleChange: (s: string | null) => void;
  onReset: () => void;
}

export default function FilterDrawer(props: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("discoveryFilters") as any;
  const hasFilters = props.category !== "all" || props.gender !== "all" || props.texture || props.style;

  return (
    <>
      {/* Trigger button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("open_filters")}
        className={`md:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-pill border text-[10px] font-heading uppercase tracking-[.08em] transition-colors duration-150 ${
          hasFilters
            ? "border-s-coral/40 text-s-coral bg-s-coral/[0.06]"
            : "border-s-ink/[0.08] text-s-ink/60"
        }`}
      >
        <SlidersHorizontal size={13} />
        {t("filter_label")} {hasFilters && <span className="ml-0.5 text-s-coral">·</span>}
      </button>

      {/* Drawer overlay */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("filter_label")}
          className="fixed inset-0 z-50 flex items-end md:hidden"
        >
          <div className="absolute inset-0 bg-s-ink/40 backdrop-blur-[6px]" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-[--raised] shadow-elevation-3 flex flex-col rounded-t-[16px] max-h-[80vh] animate-in slide-in-from-bottom">
            {/* Header */}
            <div className="px-5 py-4 border-b border-s-ink/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/50">{t("filter_label")}</p>
                <p className="font-heading text-base text-s-ink">{t("refine_search")}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="p-2 rounded-pill hover:bg-s-ink/[0.04]:bg-white/[0.04] transition-colors duration-150"
              >
                <X size={16} className="text-s-ink/50" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div>
                <p className="text-[9px] font-heading uppercase tracking-[.14em] text-s-ink/50 mb-2">{t("category")}</p>
                <CategoryPills selected={props.category} onSelect={props.onCategoryChange} />
              </div>
              <div>
                <p className="text-[9px] font-heading uppercase tracking-[.14em] text-s-ink/50 mb-2">{t("gender")}</p>
                <GenderToggle selected={props.gender} onSelect={props.onGenderChange} />
              </div>
              <div>
                <PatternSelector category={props.category === "all" ? null : props.category} selected={props.texture} onSelect={props.onTextureChange} />
              </div>
              <div>
                <StyleNamePills selected={props.style} onSelect={props.onStyleChange} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-s-ink/[0.06] flex gap-2">
              <button
                onClick={() => { props.onReset(); setOpen(false); }}
                aria-label={t("reset")}
                className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] text-xs font-heading text-s-ink/50 hover:border-s-ink/20 transition-colors duration-150"
              >
                {t("reset")}
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("apply")}
                className="flex-1 py-3 rounded-pill text-white text-xs font-heading active:scale-[0.97] transition-[transform,filter] duration-150 bg-s-coral shadow-elevation-2"
              >
                {t("apply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
