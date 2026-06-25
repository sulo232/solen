"use client";
import { useLayoutEffect, useRef } from "react";
import type { DiscoveryGender } from "@/lib/types";
import { HAIR_CUTS } from "@/lib/discovery/hair-cuts";

// Progressive HAIR filter body (drill.html v3, owner-approved). Replaces the flat pill body of FilterDrawer:
//   1. Geschlecht , segmented control with a MORPHING ink thumb that slides between Frauen/Maenner/Unisex.
//   2. Haartyp , 4 masked-PNG texture tiles (owner's /hair-patterns icons). Selected = GRAYED (sunken), no
//      checkmark, and the tile SLIDES to the leftmost slot via a robust reflow-based FLIP.
//   3. Cuts (L2) , expands under the chosen texture; text chips, grayed-selected, multi-select.
//   4. Sortieren , Fuer dich / Neu / Beliebt chips, grayed-selected.
//   5. Footer (rendered by the host shell) , reset + a wide ink "Anwenden".
// HARD RULE: selected = ink/GRAYED, never blue, never a ring. The one commit CTA (Anwenden) stays solid ink.
// #D7D7DB is the owner-approved grayed-selected border from drill.html (one step darker than s-border so the
// sunken tile reads as chosen without any colour); marked drift-ok where used.

type SortKey = "for_you" | "new" | "popular";

// Texture order in the row (also the order tiles return to on deselect). curly maps to coily.png, coily maps to
// protective.png , exactly as the owner-approved drill.html prototype.
const TEXTURES: { value: string; label: string; icon: string }[] = [
  { value: "straight", label: "Glatt", icon: "/hair-patterns/straight.png" },
  { value: "wavy", label: "Wellig", icon: "/hair-patterns/wavy.png" },
  { value: "curly", label: "Lockig", icon: "/hair-patterns/coily.png" },
  { value: "coily", label: "Coily", icon: "/hair-patterns/protective.png" },
];

const GENDERS: { value: DiscoveryGender; label: string }[] = [
  { value: "female", label: "Frauen" },
  { value: "male", label: "Männer" },
  { value: "unisex", label: "Unisex" },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "for_you", label: "Für dich" },
  { value: "new", label: "Neu" },
  { value: "popular", label: "Beliebt" },
];

export interface ProgressiveFilterProps {
  gender: DiscoveryGender | "all";
  texture: string | null;
  /** Selected cut TAG values (discovery_items.tags), multi-select. */
  cuts: string[];
  sort: SortKey;
  onGenderChange: (g: DiscoveryGender | "all") => void;
  onTextureChange: (t: string | null) => void;
  onCutsChange: (tags: string[]) => void;
  onSortChange: (s: SortKey) => void;
  /** True while the "aus deinem Profil" tag should show next to Haartyp (cleared on first manual texture change). */
  showProfileTag: boolean;
  onClearProfileTag: () => void;
}

export default function ProgressiveFilter(props: ProgressiveFilterProps) {
  const { gender, texture, cuts, sort } = props;

  // The visual order of the texture tiles: the selected texture floats to the leftmost slot, the rest keep their
  // canonical order. Recomputed each render from `texture` so it stays in sync with controlled state.
  const orderedTextures = texture
    ? [
        ...TEXTURES.filter((tx) => tx.value === texture),
        ...TEXTURES.filter((tx) => tx.value !== texture),
      ]
    : TEXTURES;

  // FLIP: when the texture selection changes the tile order, animate each tile from its previous position to its new
  // one. We capture the rects BEFORE React reorders, then in useLayoutEffect (after the DOM has the new order)
  // apply the inverse transform, force a reflow so the start frame paints, then transition back to 0. This is the
  // robust reflow approach from the prototype (rAF is throttled). Keyed on `texture`.
  const tileRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const firstLayout = useRef(true);

  useLayoutEffect(() => {
    const next = new Map<string, DOMRect>();
    tileRefs.current.forEach((el, key) => next.set(key, el.getBoundingClientRect()));

    // Skip the very first layout (mount) , there's no "before" to animate from.
    if (!firstLayout.current) {
      tileRefs.current.forEach((el, key) => {
        const before = prevRects.current.get(key);
        const after = next.get(key);
        if (!before || !after) return;
        const dx = before.left - after.left;
        if (!dx) { el.style.transition = "none"; el.style.transform = ""; return; }
        el.style.transition = "none";
        el.style.transform = `translateX(${dx}px)`;
      });
      // Force a reflow so the inverted start frame paints before we transition to 0 (robust, no rAF).
      void document.body.offsetWidth;
      tileRefs.current.forEach((el) => {
        el.style.transition = "transform .55s cubic-bezier(.34,1.28,.52,1)";
        el.style.transform = "";
      });
    }
    firstLayout.current = false;
    prevRects.current = next;
  }, [texture]);

  const segIndex = GENDERS.findIndex((g) => g.value === gender);

  const toggleTexture = (value: string) => {
    props.onClearProfileTag();
    if (texture === value) {
      props.onTextureChange(null);
      props.onCutsChange([]); // cuts belong to a texture; clear them when the texture is deselected.
    } else {
      props.onTextureChange(value);
      props.onCutsChange([]); // switching texture resets the cut selection (different taxonomy).
    }
  };

  const toggleCut = (tag: string) => {
    props.onCutsChange(cuts.includes(tag) ? cuts.filter((c) => c !== tag) : [...cuts, tag]);
  };

  const cutList = texture ? HAIR_CUTS[texture] ?? [] : [];
  const cutWord = texture ? TEXTURES.find((tx) => tx.value === texture)?.label ?? "" : "";

  return (
    <div>
      {/* 1. GESCHLECHT , segmented control, morphing ink thumb. Single-select; tapping the active one toggles to "all". */}
      <div className="mb-4">
        <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">Geschlecht</p>
        <div className="relative flex rounded-[12px] bg-s-bg-sunken p-[3px]">
          {/* The ink thumb sits behind the labels and slides via translateX(i * 100%). Hidden when gender = "all". */}
          {segIndex >= 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-[3px] top-[3px] z-0 h-9 rounded-[9px] bg-s-ink shadow-[0_1px_2px_rgba(10,10,10,.2)]"
              style={{
                width: "calc((100% - 6px) / 3)",
                transform: `translateX(${segIndex * 100}%)`,
                transition: "transform .36s cubic-bezier(.34,1.4,.5,1)",
              }}
            />
          )}
          {GENDERS.map((g) => {
            const on = gender === g.value;
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={on}
                onClick={() => props.onGenderChange(on ? "all" : g.value)}
                className={`relative z-[1] h-9 flex-1 rounded-[9px] bg-transparent font-body text-[14px] transition-colors duration-200 ${
                  on ? "font-semibold text-white" : "font-medium text-s-ink-2"
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. HAARTYP , masked-PNG tiles; grayed-selected (no check); selected slides to the leftmost slot (FLIP). */}
      <div className="mb-4">
        <p className="mb-2.5 flex items-center gap-2 font-heading text-[13px] font-bold text-s-ink">
          Haartyp
          {props.showProfileTag && (
            <span className="rounded-[20px] border border-s-border bg-s-bg-sunken px-2.5 py-0.5 text-[12px] font-medium text-s-ink-2">
              aus deinem Profil
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {orderedTextures.map((tx) => {
            const on = texture === tx.value;
            return (
              <button
                key={tx.value}
                type="button"
                ref={(el) => {
                  if (el) tileRefs.current.set(tx.value, el);
                  else tileRefs.current.delete(tx.value);
                }}
                aria-pressed={on}
                onClick={() => toggleTexture(tx.value)}
                className={`flex h-[72px] flex-1 flex-col items-center justify-center gap-1.5 rounded-[14px] border transition-[background-color,border-color] duration-150 ${
                  on ? "border-[#D7D7DB] bg-s-bg-sunken" : "border-s-border bg-white" /* drift-ok: #D7D7DB = owner-approved grayed-selected border (drill.html) */
                }`}
              >
                <span
                  aria-hidden
                  className="h-[30px] w-[30px] bg-s-ink"
                  style={{
                    WebkitMaskImage: `url(${tx.icon})`, maskImage: `url(${tx.icon})`,
                    WebkitMaskSize: "contain", maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center", maskPosition: "center",
                  }}
                />
                <span className={`text-[12px] ${on ? "font-semibold text-s-ink" : "font-medium text-s-ink-2"}`}>
                  {tx.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. CUTS (L2) , expands under the chosen texture. Text chips, grayed-selected, multi-select. */}
        <div
          className="overflow-hidden transition-[max-height,opacity] duration-[340ms] ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ maxHeight: texture ? 260 : 0, opacity: texture ? 1 : 0 }}
        >
          <div className="pt-4">
            <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">Schnitt für {cutWord}</p>
            <div className="flex flex-wrap gap-2">
              {cutList.map((cut) => {
                const on = cuts.includes(cut.tag);
                return (
                  <button
                    key={cut.tag}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCut(cut.tag)}
                    className={`h-9 rounded-[18px] border px-[15px] font-body text-[13px] transition-[background-color,border-color,color] duration-150 ${
                      on ? "border-[#D7D7DB] bg-s-bg-sunken font-semibold text-s-ink" : "border-s-border bg-white font-medium text-s-ink-2" /* drift-ok: #D7D7DB = owner-approved grayed-selected border (drill.html) */
                    }`}
                  >
                    {cut.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SORTIEREN , chips, grayed-selected. Fuer dich default. (Neu/Beliebt re-sort is a future RPC change.) */}
      <div className="mb-1">
        <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">Sortieren</p>
        <div className="flex gap-2">
          {SORTS.map((s) => {
            const on = sort === s.value;
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={on}
                onClick={() => props.onSortChange(s.value)}
                className={`h-9 rounded-[18px] border px-[17px] font-body text-[13px] transition-[background-color,border-color,color] duration-150 ${
                  on ? "border-[#D7D7DB] bg-s-bg-sunken font-semibold text-s-ink" : "border-s-border bg-white font-medium text-s-ink-2" /* drift-ok: #D7D7DB = owner-approved grayed-selected border (drill.html) */
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
