"use client";
import { useTranslations } from "next-intl";
import type { DiscoveryGender, DiscoveryCategory } from "@/lib/types";
import { HAIR_CUTS } from "@/lib/discovery/hair-cuts";

// Progressive HAIR filter body (drill.html v3, owner-approved). Replaces the flat pill body of FilterDrawer:
//   1. Geschlecht , segmented control with a MORPHING ink thumb that slides between Frauen/Maenner/Unisex.
//   2. Haartyp , 4 masked-PNG texture tiles (owner's /hair-patterns icons). Selected = GRAYED (sunken), no
//      checkmark. Plain toggle , click selects, click again deselects (no reorder/slide; reverted 2026-06-25).
//   3. Cuts (L2) , expands under the chosen texture; text chips, grayed-selected, multi-select.
//   4. Sortieren , Fuer dich / Neu / Beliebt chips, grayed-selected.
//   5. Footer (rendered by the host shell) , reset + a wide ink "Anwenden".
// HARD RULE: selected = ink/GRAYED, never blue, never a ring. The one commit CTA (Anwenden) stays solid ink.
// #D7D7DB is the owner-approved grayed-selected border from drill.html (one step darker than s-border so the
// sunken tile reads as chosen without any colour); marked drift-ok where used.

type SortKey = "for_you" | "new" | "popular";

// Texture order in the row (also the order tiles return to on deselect). curly maps to coily.png, coily maps to
// protective.png , exactly as the owner-approved drill.html prototype. `tKey` -> discoveryFilters.texture_<key>.
const TEXTURES: { value: string; tKey: string; icon: string }[] = [
  { value: "straight", tKey: "texture_straight", icon: "/hair-patterns/straight.png" },
  { value: "wavy", tKey: "texture_wavy", icon: "/hair-patterns/wavy.png" },
  { value: "curly", tKey: "texture_curly", icon: "/hair-patterns/coily.png" },
  { value: "coily", tKey: "texture_coily", icon: "/hair-patterns/protective.png" },
];

const GENDERS: { value: DiscoveryGender; tKey: string }[] = [
  { value: "female", tKey: "gender_women" },
  { value: "male", tKey: "gender_men" },
  { value: "unisex", tKey: "gender_unisex" },
];

const SORTS: { value: SortKey; tKey: string }[] = [
  { value: "for_you", tKey: "sort_for_you" },
  { value: "new", tKey: "sort_new" },
  { value: "popular", tKey: "sort_popular" },
];

export interface ProgressiveFilterProps {
  /** Active feed category. Haartyp + Cuts (L2) render ONLY for "hair" (the one category with texture/cut data). */
  category: DiscoveryCategory | "all";
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
  const { category, gender, texture, cuts, sort } = props;
  // `as any` (the established discovery-folder pattern, mirrors FilterDrawer.tsx) so dynamic tKeys like
  // g.tKey / tx.tKey / s.tKey / the texture-derived cut heading key resolve without per-key literal typing.
  const t = useTranslations("discoveryFilters") as any;
  // FIX 1(b): Haartyp + Cuts (L2) are a HAIR-only taxonomy (only "hair" carries texture + cut tags). For any other
  // category render just Geschlecht + Sortieren, so the filter never seeds a stuck texture/cut that empties the feed.
  const showHair = category === "hair";

  // Owner 2026-06-25: the hair-type tiles are a PLAIN toggle , click = grayed (selected), click again =
  // deselect. They keep their fixed order; no slide-to-left, no FLIP, no animation (that was reverted at the
  // owner's request for this specific component). The gender morphing thumb below is unaffected.
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
  const cutTexKey = texture ? TEXTURES.find((tx) => tx.value === texture)?.tKey : undefined;
  const cutWord = cutTexKey ? t(cutTexKey) : "";

  return (
    <div>
      {/* 1. GESCHLECHT , segmented control, morphing ink thumb. Single-select; tapping the active one toggles to "all". */}
      <div className="mb-4">
        <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">{t("gender")}</p>
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
                {t(g.tKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. HAARTYP , masked-PNG tiles; grayed-selected (no check); plain toggle, no reorder/slide.
          FIX 1(b): hair-only. Rendered solely for category "hair"; other categories skip straight to Sortieren. */}
      {showHair && (
      <div className="mb-4">
        <p className="mb-2.5 flex items-center gap-2 font-heading text-[13px] font-bold text-s-ink">
          {t("hairType")}
          {props.showProfileTag && (
            <span className="rounded-[20px] border border-s-border bg-s-bg-sunken px-2.5 py-0.5 text-[12px] font-medium text-s-ink-2">
              {t("profile_tag")}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {TEXTURES.map((tx) => {
            const on = texture === tx.value;
            return (
              <button
                key={tx.value}
                type="button"
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
                  {t(tx.tKey)}
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
            <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">{t("cut_for", { texture: cutWord })}</p>
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
      )}

      {/* 4. SORTIEREN , chips, grayed-selected. Fuer dich default. (Neu/Beliebt re-sort is a future RPC change.) */}
      <div className="mb-1">
        <p className="mb-2.5 font-heading text-[13px] font-bold text-s-ink">{t("sortBy")}</p>
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
                {t(s.tKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
