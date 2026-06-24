"use client";
import { useState, useEffect, useRef } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DiscoveryGender } from "@/lib/types";

type SortKey = "for_you" | "new" | "popular";

interface FilterDrawerProps {
  gender: DiscoveryGender | "all";
  texture: string | null;
  style: string | null;
  onGenderChange: (g: DiscoveryGender | "all") => void;
  onTextureChange: (t: string | null) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  /** DNA pre-select: the viewer's saved profile values (null when no profile / logged out). */
  dnaGender?: DiscoveryGender | null;
  dnaTexture?: string | null;
  onReset: () => void;
}

const GENDER_KEYS: (DiscoveryGender)[] = ["female", "male", "unisex"];
const TEXTURE_KEYS = ["straight", "wavy", "curly", "coily"] as const;
const SORT_KEYS: SortKey[] = ["for_you", "new", "popular"];

// V3-D414 -> mockup E (2026-06-24): the sheet is now three PILL groups (Geschlecht / Haartyp / Sortieren),
// pre-set from the viewer's DNA (disc_gender + disc_hair_texture) when they haven't already chosen. Selected =
// INK FILL (never blue, per the graveyard: a blue outline reads as the banned focus ring). No count badge on the
// trigger (owner: "don't put any numbers counts"). Primary stays INK per LOCKFILE §1.5.
function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex h-10 shrink-0 items-center rounded-[14px] px-4 font-heading text-[14px] font-semibold transition-colors duration-150 ${
        selected
          ? "border border-s-ink bg-s-ink text-white"
          : "border border-s-border bg-white text-s-ink-2 hover:text-s-ink"
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterDrawer(props: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("discoveryFilters") as any;
  const tg = useTranslations("discover.gender") as any;

  // DNA pre-select: when the sheet first opens, seed gender + hair-type from the profile IF the viewer hasn't
  // already set that filter (so it never overrides a manual choice). Runs once per "open" rising edge.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!open) { seededRef.current = false; return; }
    if (seededRef.current) return;
    seededRef.current = true;
    if (props.gender === "all" && props.dnaGender) props.onGenderChange(props.dnaGender);
    if (!props.texture && props.dnaTexture) props.onTextureChange(props.dnaTexture);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {/* Trigger: sliders icon, white square pill. No count badge (owner 2026-06-24: no numbers/counts). */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("open_filters")}
        className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-s-border bg-white text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
      >
        <SlidersHorizontal size={18} />
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
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <p className="pb-3.5 pt-0.5 text-[12.5px] text-s-ink-2">{t("dna_note")}</p>

              {/* Geschlecht: pills (was RadioRows). Tapping the active gender toggles it off (back to "all"). */}
              <div className="mb-4">
                <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">{t("gender")}</p>
                <div className="flex flex-wrap gap-2.5">
                  {GENDER_KEYS.map((key) => (
                    <Pill
                      key={key}
                      label={tg(key === "female" ? "women" : key === "male" ? "men" : key)}
                      selected={props.gender === key}
                      onClick={() => props.onGenderChange(props.gender === key ? "all" : key)}
                    />
                  ))}
                </div>
              </div>

              {/* Haartyp (NEW). Maps Glatt/Wellig/Lockig/Coily to texture values straight/wavy/curly/coily. Toggles off. */}
              <div className="mb-4">
                <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">{t("hairType")}</p>
                <div className="flex flex-wrap gap-2.5">
                  {TEXTURE_KEYS.map((key) => (
                    <Pill
                      key={key}
                      label={t(`texture_${key}`)}
                      selected={props.texture === key}
                      onClick={() => props.onTextureChange(props.texture === key ? null : key)}
                    />
                  ))}
                </div>
              </div>

              {/* Sortieren (NEW). "Für dich" is the default (the current feed order). Neu/Beliebt are selectable;
                  their re-order is a follow-up RPC change (see report) so they currently behave as Für dich. */}
              <div className="mb-1">
                <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">{t("sortBy")}</p>
                <div className="flex flex-wrap gap-2.5">
                  {SORT_KEYS.map((key) => (
                    <Pill
                      key={key}
                      label={t(`sort_${key}`)}
                      selected={props.sort === key}
                      onClick={() => props.onSortChange(key)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer: Zurücksetzen (ghost) · Anwenden (INK, per LOCKFILE) */}
            <div className="flex gap-2.5 border-t border-s-border px-5 py-4">
              <button
                onClick={() => { props.onReset(); setOpen(false); }}
                className="h-12 flex-1 rounded-pill border border-s-border bg-white font-heading text-[15px] font-bold text-s-ink transition-colors duration-150 hover:bg-s-bg-sunken"
              >
                {t("reset")}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-12 flex-[1.4] rounded-pill bg-s-ink font-heading text-[15px] font-bold text-white transition-transform duration-150 active:scale-[0.97]"
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
