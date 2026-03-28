"use client";
import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
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
  const hasFilters = props.category !== "all" || props.gender !== "all" || props.texture || props.style;

  return (
    <>
      {/* Trigger button — visible on mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-pill border text-[10px] font-heading font-bold uppercase tracking-[.08em] transition-colors"
        style={hasFilters
          ? { borderColor: "rgba(232,98,74,.40)", color: "#E8624A", background: "rgba(232,98,74,.06)" }
          : { borderColor: "rgba(26,18,9,.08)", color: "rgba(26,18,9,.60)" }}
      >
        <SlidersHorizontal size={13} />
        Filter {hasFilters && <span className="ml-0.5 text-s-coral">·</span>}
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-s-ink/40" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-white dark:bg-s-dm-surface shadow-warm-float flex flex-col rounded-t-[16px] max-h-[80vh] animate-in slide-in-from-bottom">
            {/* Header */}
            <div className="px-5 py-4 border-b border-s-ink/[0.06] dark:border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30">Filter</p>
                <p className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">Suche verfeinern</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-[8px] hover:bg-s-ink/[0.04] dark:hover:bg-white/[0.04]">
                <X size={16} className="text-s-ink/50 dark:text-s-dm-text/50" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">Kategorie</p>
                <CategoryPills selected={props.category} onSelect={props.onCategoryChange} />
              </div>
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">Geschlecht</p>
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
            <div className="px-5 py-4 border-t border-s-ink/[0.06] dark:border-white/[0.06] flex gap-2">
              <button
                onClick={() => { props.onReset(); setOpen(false); }}
                className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-xs font-heading font-bold text-s-ink/50 dark:text-s-dm-text/50 hover:border-s-ink/20 transition-colors"
              >
                Zurücksetzen
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-pill text-white text-xs font-heading font-bold active:scale-[0.98] transition-[transform,filter] duration-150 shadow-coral-glow"
                style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}
              >
                Anwenden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
