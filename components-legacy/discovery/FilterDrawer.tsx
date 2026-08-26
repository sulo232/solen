"use client";
import { useState, useEffect, useRef } from "react";
import { X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DiscoveryGender, DiscoveryCategory } from "@/lib/types";
import ProgressiveFilter from "@/components-legacy/discovery/ProgressiveFilter";

interface FilterDrawerProps {
  /** Active feed category. Gates the Haartyp + Cuts (L2) hair-only sections; only "hair" has cut/texture data. */
  category: DiscoveryCategory | "all";
  gender: DiscoveryGender | "all";
  texture: string | null;
  style: string | null;
  /** Selected cut TAG values (discovery_items.tags) for the L2 progressive drill-down. Multi-select. */
  cuts: string[];
  onGenderChange: (g: DiscoveryGender | "all") => void;
  onTextureChange: (t: string | null) => void;
  onCutsChange: (tags: string[]) => void;
  /** DNA pre-select: the viewer's saved profile values (null when no profile / logged out). */
  dnaGender?: DiscoveryGender | null;
  dnaTexture?: string | null;
  /** DNA hair length (short | medium | long), drives the banner sub-phrase. null when not set. */
  dnaLength?: string | null;
  onReset: () => void;
}

// V3-D414 -> drill.html v3 (owner-approved): the sheet body is now the PROGRESSIVE drill-down filter
// (Geschlecht morphing thumb / Haartyp masked tiles with FLIP / Cuts L2 / Sortieren). The shell here (trigger,
// bottom sheet, grabber, circled-X, dim backdrop, footer) is reused; only the body changed. Selected = ink/GRAYED
// (never blue, per the graveyard: a blue outline reads as the banned focus ring). Primary stays INK per LOCKFILE §1.5.
export default function FilterDrawer(props: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("discoveryFilters") as any;

  // "aus deinem Profil" tag: shows when the texture was pre-seeded from DNA and the user hasn't manually changed it
  // yet. Cleared on the first manual texture change (and reset each time the sheet re-opens).
  const [showProfileTag, setShowProfileTag] = useState(false);

  // DNA pre-select: when the sheet first opens, seed gender + hair-type from the profile IF the viewer hasn't
  // already set that filter (so it never overrides a manual choice). Runs once per "open" rising edge.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!open) { seededRef.current = false; return; }
    if (seededRef.current) return;
    seededRef.current = true;
    if (props.gender === "all" && props.dnaGender) props.onGenderChange(props.dnaGender);
    // FIX 1(c): only seed a hair TEXTURE on a hair feed. nails/lashes/brows have no texture taxonomy, so a
    // pre-seeded hair texture there would silently empty the feed. Gender seed is fine for all categories.
    if (props.category === "hair" && !props.texture && props.dnaTexture) {
      props.onTextureChange(props.dnaTexture);
      setShowProfileTag(true); // pre-seeded from profile → show the "aus deinem Profil" tag until manual change.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {/* Trigger: sliders icon, white square pill. No count badge (owner 2026-06-24: no numbers/counts).
          OVERRIDE 2026-08-02 (owner, THIRD repeat, "why are there no shadows, everything is like a
          whole different style"): the 2026-08-01 shadow-whisper pass still read as flat next to the
          rest of the site, because home/category's own resting white pills (HomeSearchPill.tsx:92,
          ContinueCard.tsx:168, SearchTemplate.tsx:1303) don't use shadow-whisper at all , they share a
          crisper 1px `border-s-border` + `shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]` recipe, measured LIVE
          and identical across all three. That is the real "different style" gap. Swapped to that exact
          recipe (border restored + the measured shadow); radius/size untouched, only the shadow/border
          treatment was named as wrong (mockup-first "treatment only" rule). mockup-ok: owner-directed
          literal fix with values measured off existing shipped components, not invented. */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("open_filters")}
        className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-s-border bg-white text-s-ink-2 shadow-[0_2px_8px_0_rgba(0,0,0,0.07)] transition-colors duration-150 hover:text-s-ink"
      >
        <SlidersHorizontal size={18} strokeWidth={1.9} />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={t("filter_label")} className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-s-ink/40 backdrop-blur-[6px] animate-in fade-in duration-200" onClick={() => setOpen(false)} />
          <div className="relative flex max-h-[82vh] w-full flex-col rounded-t-[26px] bg-white shadow-elevation-3 animate-in slide-in-from-bottom duration-300">
            {/* Grabber */}
            <div className="mx-auto mt-2.5 h-1 w-[38px] rounded-full bg-s-border" />

            {/* Header: title · circled ✕ */}
            <div className="flex items-center justify-between px-5 pb-1 pt-3">
              <p className="font-heading text-[18px] font-bold tracking-[-0.02em] text-s-ink">{t("filter_label")}</p>
              <button onClick={() => setOpen(false)} aria-label={t("close")} className="grid h-[34px] w-[34px] place-items-center rounded-full border border-s-border bg-white text-s-ink transition-colors duration-150 hover:bg-s-bg-sunken">
                <X size={15} strokeWidth={1.9} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-2">
              {/* Progressive drill-down body (drill.html v3): Geschlecht morphing thumb · Haartyp masked tiles with
                  slide-to-left FLIP · Cuts L2 (multi-select). Pre-selected gender + texture are seeded
                  above from the viewer's DNA. */}
              <ProgressiveFilter
                category={props.category}
                gender={props.gender}
                texture={props.texture}
                cuts={props.cuts}
                onGenderChange={props.onGenderChange}
                onTextureChange={props.onTextureChange}
                onCutsChange={props.onCutsChange}
                showProfileTag={showProfileTag}
                onClearProfileTag={() => setShowProfileTag(false)}
              />
            </div>

            {/* Footer: Anwenden (INK, per LOCKFILE), preceded by a small circular reset icon only when a filter is
                active. Reset = clear + close; Anwenden = close. */}
            {(() => {
              const active = props.gender !== "all" || !!props.texture || props.cuts.length > 0;
              return (
                <div className="flex gap-2.5 border-t border-s-border px-5 py-4">
                  {active && (
                    <button
                      type="button"
                      onClick={() => { props.onReset(); setOpen(false); }}
                      aria-label={t("reset")}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink transition-colors duration-150 hover:bg-s-bg-sunken"
                    >
                      <RotateCcw size={18} strokeWidth={1.9} />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="h-11 flex-1 rounded-pill bg-s-ink font-heading text-[15px] font-bold text-white transition-transform duration-150 active:scale-[0.97]"
                  >
                    {t("apply")}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
