"use client";
import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DiscoveryGender } from "@/lib/types";

interface FilterDrawerProps {
  gender: DiscoveryGender | "all";
  texture: string | null;
  style: string | null;
  onGenderChange: (g: DiscoveryGender | "all") => void;
  onReset: () => void;
}

const GENDER_KEYS: (DiscoveryGender | "all")[] = ["all", "female", "male", "unisex"];

// V3-D414: filter rebuilt to the captured Pinterest pattern (IMG_4980) in Solen skin — a clean RADIO list
// (Kategorie + Für) + Reset/Anwenden, and a count BADGE on the sliders trigger (replaces the tiny "weird dot").
// Texture + style stay in the chip row (they're redundant here), so the sheet reads clean. Primary stays INK
// (not Pinterest red) per LOCKFILE §1.5.
function RadioRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex w-full items-center justify-between px-1 py-3.5 text-left transition-colors duration-150 active:bg-s-bg-sunken"
    >
      <span className="font-heading text-[16px] font-semibold text-s-ink">{label}</span>
      <span className={`grid h-[22px] w-[22px] place-items-center rounded-full border-2 transition-colors duration-150 ${selected ? "border-s-ink" : "border-s-border"}`}>
        {selected && <span className="h-[11px] w-[11px] rounded-full bg-s-ink" />}
      </span>
    </button>
  );
}

export default function FilterDrawer(props: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("discoveryFilters") as any;
  const tg = useTranslations("discover.gender") as any;

  // Count of active filters → the trigger badge. Texture/style still count (set from the chip row) so the badge
  // reflects the true active state even though they're not edited in this sheet. Category is NOT a filter (owner
  // 2026-06-23): it's the top selector, removed from this sheet entirely, so it never counts here.
  const activeCount =
    (props.gender !== "all" ? 1 : 0) + (props.texture ? 1 : 0) + (props.style ? 1 : 0);

  return (
    <>
      {/* Trigger — sliders icon + active-count badge (V3-D414, was a tiny ink dot the user flagged as "weird"). */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("open_filters")}
        /* Owner 2026-06-20: the count badge alone signals active filters. Dropped the active-state black ring
           (border-s-ink) , it read as a heavy black circle. Border stays a neutral hairline; active just darkens the icon. */
        className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-s-border bg-white transition-colors duration-150 ${
          activeCount > 0 ? "text-s-ink" : "text-s-ink-2 hover:text-s-ink"
        }`}
      >
        <SlidersHorizontal size={18} />
        {activeCount > 0 && (
          <span className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-s-ink px-1 text-[12px] font-heading font-bold leading-none text-white ring-2 ring-white animate-in zoom-in duration-200">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={t("filter_label")} className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-s-ink/40 backdrop-blur-[6px] animate-in fade-in duration-200" onClick={() => setOpen(false)} />
          <div className="relative flex max-h-[82vh] w-full flex-col rounded-t-[22px] bg-white shadow-elevation-3 animate-in slide-in-from-bottom duration-300">
            {/* Header: ✕ · title (centered) */}
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <button onClick={() => setOpen(false)} aria-label={t("close")} className="text-s-ink transition-colors duration-150 hover:text-s-ink-2">
                <X size={20} />
              </button>
              <p className="font-heading text-[17px] font-semibold text-s-ink">{t("filter_label")}</p>
              <span className="w-5" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {/* Category radios removed (owner 2026-06-23): category is the top selector, never a filter here. */}
              <p className="pb-1 pt-3 font-heading text-[13px] font-bold text-s-ink">{t("gender")}</p>
              {GENDER_KEYS.map((key) => (
                <RadioRow
                  key={key}
                  label={tg(key === "female" ? "women" : key === "male" ? "men" : key)}
                  selected={props.gender === key}
                  // Owner 2026-06-24: tapping the already-selected gender DESELECTS it (back to "all"), so it toggles.
                  onClick={() => props.onGenderChange(props.gender === key ? "all" : key)}
                />
              ))}
            </div>

            {/* Footer: Reset (sunken) · Apply (INK, per LOCKFILE) */}
            <div className="flex gap-2.5 border-t border-s-border px-5 py-4">
              <button
                onClick={() => { props.onReset(); setOpen(false); }}
                className="h-12 flex-1 rounded-pill bg-s-bg-sunken font-heading text-[15px] font-semibold text-s-ink transition-colors duration-150 hover:bg-s-bg-sunken"
              >
                {t("reset")}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-12 flex-1 rounded-pill bg-s-ink font-heading text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[0.97]"
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
