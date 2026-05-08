import { SearchBar } from "./SearchBar";

/**
 * Homepage hero — V3 (post V2-D26 typography + V2-D15-3 brand pivot).
 *
 * Spec:
 *   - LIVE_TRUTH §13 hero
 *   - LIVE_TRUTH §5g atmosphere wash (softened hero variant)
 *   - LIVE_TRUTH §5 typography (Cooper BT display + ITC Avant Garde body)
 *   - LIVE_TRUTH §0d.4 mobile-first (centered on mobile, left-aligned desktop)
 *
 * Mockup: public/solen-v2-homepage.html lines ~1010-1064.
 *
 * Server component. Search bar is **visual-only** for commit #1; interactions
 * (Was/Wo/Wann segment sheets, autocomplete, submit) wire in a follow-up
 * commit once Phase 1 §F.x sheet/dropdown patterns are wired.
 *
 * TODO:
 *   - i18n via next-intl `useTranslations("home.hero")` once de/en/fr/it
 *     messages are updated for the new V3 copy. Existing keys in messages/
 *     have legacy copy ("Beauty Buchungsplattform · Schweiz" etc.) — left
 *     hardcoded here in DE for now to ship the visual.
 *   - Wire search bar interactions (Phase 1).
 *   - Body-wide atmosphere wash (currently hero-only — body wash is a
 *     separate page-level concern, not Hero's responsibility).
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Local hero wash REMOVED 2026-05-09 — was creating intensity
          discontinuity between the hero zone and sections below. The
          page-wide body::before / body::after wash (globals.css) now
          carries the entire page at the saturated intensity user wanted
          ("i like how it is in the header... make me one whole page"). */}

      {/* pt accounts for the absolute V3 Header (floats over wash):
          mobile = ~68px header + 32px breathing = 100px (pt-25)
          desktop = ~80px header + 48px breathing = 128px (pt-32)
          tailwind doesn't have pt-25, use arbitrary value. */}
      <div className="relative mx-auto flex max-w-[1280px] flex-col px-5 pt-[100px] pb-20 md:px-8 md:pt-32 max-md:items-center max-md:text-center">
        <div className="max-md:w-full">
          {/* Eyebrow with brand-colored dot before. whitespace-nowrap prevents
              awkward 2-line wrap on narrow desktop widths (~1024px). */}
          <span className="font-body mb-[18px] inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.18em] text-s-ink-3 before:block before:h-[6px] before:w-[6px] before:rounded-full before:bg-s-brand before:content-['']">
            Beauty in der Schweiz
          </span>

          {/* H1 — Cooper BT 900, clamped 40-96px, brand color on emphasized word.
              V2-D15: italic banned. The emphasized "buchen" uses brand color, not italic. */}
          <h1 className="font-display mb-6 text-[clamp(40px,7vw,96px)] font-black leading-[0.95] tracking-[-0.025em] text-s-ink">
            Schöner aussehen, schneller{" "}
            <span className="text-s-brand">buchen</span>.
          </h1>

          {/* Deck removed 2026-05-09 (Option A locked): user picked the cleaner
              eyebrow + h1 + search structure. The "ohne Anrufen, ohne Warten"
              non-negotiable from §0d.5 stays as a brand law in LIVE_TRUTH;
              not every page needs to recite it as marketing copy. The "So
              funktioniert's →" link will surface elsewhere on the page (e.g.
              footer or a dedicated /so-funktioniert route). */}
          <div className="mb-8" />
        </div>

        <SearchBar />
      </div>
    </section>
  );
}

/**
 * @deprecated SearchBar moved to its own file with full Dynamic-Island-style
 * expand-on-click pickers. The function below is left in place ONLY so the
 * old non-expanding render path still compiles if anyone re-imports it. Real
 * SearchBar is now `./SearchBar.tsx`.
 */
function _DeprecatedSearchBar() {
  return (
    <div
      className="
        flex w-full max-w-[540px] flex-col rounded-2xl border border-black/5 bg-white p-2
        shadow-[0_1px_3px_rgba(50,47,44,0.04),0_4px_12px_rgba(50,47,44,0.04)]
        max-md:mx-auto
        md:max-w-none md:flex-row md:items-stretch md:rounded-full md:p-[6px_6px_6px_8px]
        md:shadow-[0_1px_3px_rgba(50,47,44,0.04),0_8px_24px_rgba(50,47,44,0.08)]
      "
    >
      {/* Service — active by default to telegraph affordance */}
      <SearchRow
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <circle cx={11} cy={11} r={7} />
            <path d="m21 21-4.3-4.3" />
          </svg>
        }
        label="Service suchen"
        value="Service"
        isPlaceholder
        isActive
        isFirst
      />

      <SearchRow
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
            <circle cx={12} cy={10} r={3} />
          </svg>
        }
        label="Standort wählen"
        value="Stadt"
        isPlaceholder
      />

      <SearchRow
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <rect x={3} y={4} width={18} height={18} rx={2} />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        }
        label="Zeit wählen"
        value="Zeit"
        isPlaceholder
      />

      {/* Submit — brand-teal bg, hover lighter brand-mid. Full-width on mobile,
          pill on right desktop. (Was bg-s-ink default → hover bg-s-brand;
          flipped 2026-05-09 per user feedback — black felt out of place
          when the rest of the page already pulls toward brand-teal.) */}
      <button
        type="button"
        className="
          font-body shrink-0 rounded-full border-0 bg-s-brand p-4 font-semibold text-white transition-colors
          hover:bg-s-brand-mid
          md:px-7
        "
      >
        Solen durchsuchen
      </button>
    </div>
  );
}

interface SearchRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isPlaceholder?: boolean;
  isActive?: boolean;
  isFirst?: boolean;
}

function SearchRow({
  icon,
  label,
  value,
  isPlaceholder,
  isActive,
  isFirst,
}: SearchRowProps) {
  // Active row: faint brand-teal wash (5% alpha) — barely visible against
  // the §5g atmosphere wash. Visible WAS/WO/WANN labels removed; aria-label
  // preserves accessibility. Vertical divider added 2026-05-09 between icon
  // and value (per user feedback "make a line and make the text a little
  // away") — gives the row visual structure and breaks up the empty-feeling
  // right side after labels were dropped.
  return (
    <button
      type="button"
      aria-label={label}
      className={`
        group flex shrink-0 cursor-pointer items-center text-left
        rounded-[10px] p-[14px_16px]
        transition-colors hover:bg-s-bg-sunken
        ${isActive ? "bg-s-brand/[0.05]" : ""}
        ${!isFirst ? "border-t border-black/5 max-md:border-t md:border-t-0" : ""}
        md:flex-1 md:rounded-full md:border-t-0 md:p-[14px_22px]
      `}
    >
      {/* Icon column — right-bordered to create the vertical divider */}
      <span className="flex shrink-0 items-center justify-center pr-3 text-s-ink-2 border-r border-black/10">
        {icon}
      </span>
      {/* Value column — left-padded so text sits "a little away" from the line */}
      <span
        className={`
          font-body min-w-0 flex-1 truncate text-base text-s-ink-3 pl-4
          ${isPlaceholder ? "font-normal" : "font-medium"}
        `}
      >
        {value}
      </span>
    </button>
  );
}
