import { SearchBar } from "./SearchBar";
import { getSessionUser } from "@/lib/supabase";

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
 * Async server component. Reads session for the V2-D66 friendly greeting
 * (Hayden move #14). Anon users see h1 + SearchBar; authed users see a
 * "Hallo, {name} 👋" line above the h1.
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
export default async function Hero() {
  // V2-D66 (2026-05-16, Hayden move #14): personalized greeting for authed users.
  // Fallback chain: profile.display_name → email local part (capitalized) → no
  // greeting. Anon visitors see the h1-only hero as before — no fake "Hallo".
  const { supabase, user } = await getSessionUser();
  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = (profile as { display_name?: string | null } | null)?.display_name ?? null;
    if (!displayName && user.email) {
      const local = user.email.split("@")[0] ?? "";
      displayName = local ? local.charAt(0).toUpperCase() + local.slice(1) : null;
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Local hero wash REMOVED 2026-05-09 — was creating intensity
          discontinuity between the hero zone and sections below. The
          page-wide body::before / body::after wash (globals.css) now
          carries the entire page at the saturated intensity user wanted
          ("i like how it is in the header... make me one whole page"). */}

      {/* V2-D48-3 (2026-05-09): hero now fills most of the viewport and centers
          content vertically (Fresha pattern). Was pt-[100px] pb-20 (compact),
          which jammed the h1 + search at the top and let Recently Viewed peek
          ~half-viewport down. Now min-h fills 80vh mobile / 88vh desktop,
          flex items-center vertically centers the content block — h1 + search
          sit middle-screen, Recently Viewed barely peeks below the fold. */}
      {/* V2-D67 (2026-05-15) — Fresha-aligned hero layout.
       *  Was: centered (mobile) + eyebrow + h1 + immediate SearchBar.
       *  Now: LEFT-ALIGNED at all viewports + NO eyebrow + bigger h1 +
       *  descriptive subtitle below h1 + SearchBar. Matches the Fresha
       *  pattern (left-anchored editorial header → subtitle → search box).
       *  Spacing tightened so the h1+subtitle+search read as ONE unit
       *  instead of three floating elements. */}
      {/* V2-D67-fu2 (2026-05-15): user feedback "no not more text" — dropped
       *  the subtitle paragraph that V2-D67 added. Hero is now just h1 +
       *  SearchBar, with the hero zone made taller (min-h 88vh mobile / 92vh
       *  desktop) so the Zuletzt-angesehen cards sit further down — gives
       *  the search box visual room to breathe and matches Fresha's
       *  "search dominates the fold, content peeks below" pattern. */}
      {/* V2-D67-fu12 (2026-05-16): mobile min-h dropped 88vh → 70vh to fix the
          "huge empty gap" complaint on iPhone. Hero stayed Fresha-tall on
          desktop (92vh) where the longer viewport absorbs it; on phones the
          88vh reserved 75-85% of screen height for hero + search alone, pushing
          Recently Viewed too far below the fold and leaving atmosphere-only
          dead zone during scroll-down. 70vh keeps search comfortably above the
          fold while sections start ~150-200px sooner. */}
      {/* V2-D71 (2026-05-18) — expanded hero gradient per user "the peach
          glow is currently a bit too weak, expand the radius so it acts as
          a warm spotlight behind your text, fading smoothly before the
          search card." Ellipse 60→85% width, 50→65% height. Center moved
          50%/30% so it sits behind the h1+greeting more deliberately. Inner
          stop bumped from #FFF0E6 to #FFE2D0 (deeper, warmer peach — more
          spotlight, less wash). Fade reaches transparent by 75% (was 70%)
          so it dissolves well before the search card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[120px] -left-[15%] -right-[15%] h-[640px] z-0"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 50% 30%, #FFE2D0 0%, #FFEFE4 35%, transparent 75%)",
        }}
      />
      {/* V3-D73 (2026-05-18): vh → dvh per advanced-UI doc — fixes iOS Safari
          floating bottom address bar collision. dvh dynamically recalculates as
          Safari's bar expands/contracts, preventing the hero from getting
          partially hidden beneath the bar when it appears. */}
      <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col justify-center px-5 pt-[100px] pb-12 md:px-8 md:pt-32 md:pb-16 min-h-[70dvh] md:min-h-[92dvh]">
        <div className="w-full">
          {displayName && (
            // V2-D70 (2026-05-18): greeting weight bumped 500 medium → still 500
            // but now in Plus Jakarta Sans (single-family typography lock).
            <p className="mb-3 font-body text-[15px] md:text-[17px] font-medium text-s-ink-2 tracking-[-0.005em]">
              Hallo, {displayName}
            </p>
          )}
          <h1
            // V2-D70 (2026-05-18) — warm minimal h1: Plus Jakarta Sans 800,
            // larger size clamp(40, 8.5vw, 60), tighter tracking -0.035em.
            // Extreme weight contrast vs body 500 (single-family system).
            className="mb-10 font-display text-[clamp(40px,8.5vw,60px)] font-extrabold leading-[1.02] tracking-[-0.035em] text-s-ink"
          >
            Schöner aussehen, schneller{" "}
            <span className="text-s-accent">buchen</span>.
          </h1>
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
        shadow-[0_20px_40px_rgba(50,47,44,0.04)]
        max-md:mx-auto
        md:max-w-none md:flex-row md:items-stretch md:rounded-full md:p-[6px_6px_6px_8px]
        md:shadow-[0_30px_60px_rgba(50,47,44,0.05)]
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
