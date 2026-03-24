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
        className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-btn bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60"
      >
        <SlidersHorizontal size={14} />
        Filters
        {hasFilters && <span className="w-2 h-2 rounded-full bg-s-coral" />}
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-s-ink/40" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-white dark:bg-s-dm-surface rounded-t-[16px] p-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-heading font-bold text-s-ink dark:text-s-dm-text">Filters</h3>
              <button onClick={() => setOpen(false)} className="p-1"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">Category</p>
                <CategoryPills selected={props.category} onSelect={props.onCategoryChange} />
              </div>
              <div>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">Gender</p>
                <GenderToggle selected={props.gender} onSelect={props.onGenderChange} />
              </div>
              <div>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">Texture / Type</p>
                <PatternSelector category={props.category === "all" ? null : props.category} selected={props.texture} onSelect={props.onTextureChange} />
              </div>
              <div>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1.5">Style</p>
                <StyleNamePills selected={props.style} onSelect={props.onStyleChange} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { props.onReset(); setOpen(false); }}
                className="flex-1 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60"
              >
                Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
