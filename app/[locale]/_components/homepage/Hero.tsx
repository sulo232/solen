import { SearchBar } from "./SearchBar";
import { Calendar, MapPin, Search } from "lucide-react";
// V3-D139 (2026-05-25): HeroHeadline removed per "Fix 1 + Fix 2" spec —
// rotating slogans (incl. unapproved "Auch broke? Dw, wir haben Coupons." +
// "Check it out →" CTA) replaced with the locked static H1 + sub-line below.
// Component file kept at ./_components/homepage/HeroHeadline.tsx for revert.
// import HeroHeadline from "./HeroHeadline";
import { getSessionUser } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";

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
 * "Hallo, {name}" line above the h1 (waving-hand emoji removed V3-D311).
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
export default async function Hero({ locale }: { locale: string }) {
  // 2026-08-15 i18n sweep: the h1 below was a hardcoded German literal. This is an async server
  // component, so it takes getTranslations, not the useTranslations hook.
  const t = await getTranslations({ locale, namespace: "home.hero" });
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
      {/* V3-D137 (2026-05-25): sunset halo bg MOVED OUT of Hero → page.tsx
          wrapper so it extends behind the sticky header. See page.tsx top
          for the gradient layer.
          Hero is back to its original transparent state. */}

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
      {/* V3-D83 (2026-05-19): atmosphere now lives on the page wrapper
          (page.tsx) so it bleeds past the hero into the first feed sections,
          mirroring Fresha's pattern where the spotlight extends ~1500px
          before fully fading. The Hero itself is now a transparent zone
          over that wrapper-level wash. */}
      {/* V3-D73 (2026-05-18): vh → dvh per advanced-UI doc — fixes iOS Safari
          floating bottom address bar collision. dvh dynamically recalculates as
          Safari's bar expands/contracts, preventing the hero from getting
          partially hidden beneath the bar when it appears. */}
      {/* V3-D127 (2026-05-24): removed min-h-[70dvh] on mobile per Fresha
          hierarchy analysis. The 70dvh + justify-center was floating the
          headline + search card to the vertical center of the viewport,
          adding ~48px of dead whitespace above the headline. Removing it
          lets content flow naturally from the top (Fresha pattern).
          Desktop keeps md:min-h-[92dvh] — different viewport rhythm. */}
      {/* V3-D128 (2026-05-24): px-5 → px-7 (20→28 CSS px each side) per
          MEASURED Fresha comparison. At 402 CSS viewport: Solen card was
          388 CSS wide (6/7 margin), Fresha was 346 CSS wide (27/28 margin).
          Bumping outer container padding pulls search card width in to
          ~346 CSS, matching Fresha's ~86% viewport ratio. Headline shifts
          ~8px right too — kept aligned with the card edge. */}
      {/* V3-D132 (2026-05-25): pb-12 → pb-2 (48→8) per Airbnb gap match —
          biggest offender of the hero→Für dich gap (was ~49 CSS). */}
      {/* V3-D151 (2026-05-25): mobile pt 100px → 32px per user "out ths abit
          more up". Measured: 100px gap between Header bottom and H1 top was
          too generous given the CityTopBar (53) + Header (84) already take
          137px of fixed space at viewport top. 32px keeps breathing without
          dead-zone. Desktop pt-32 kept for the min-h-[92dvh] vertical-center
          rhythm — not flagged by user. */}
      {/* V3-D228 (2026-05-27, desktop placement fix — md: scoped only, mobile
          untouched). MEASURED Fresha desktop homepage at 1280 viewport:
            - H1 sits at y=184 (top, after header). NOT vertical-centered.
            - Hero content margins ~92px each side (1096px content width).
            - Search row has fixed-width 91px button at right, not stretched.
          Our problem before fix: md:min-h-[92dvh] + flex justify-center pushed
          the hero block to viewport middle, creating a 400px white void above
          the H1. md:pt-32 added another 128px of top padding inside that.
          Fix: drop md:min-h-[92dvh], pt-32 → pt-12. Hero now hugs the top
          like Fresha. Mobile (max-w + pt-8) unchanged. */}
      {/* V3-D327 (2026-05-27): Fresha-aligned hero per council pick (Grok 2×
          consistent answer + user "exact to fresha"). Bumps header→H1 gap to
          match Fresha's measured 64-72px (pt-16 = 64px mobile; pt-20 = 80px
          desktop). Hero H1 grew 26→40 mobile / 30→64 desktop in the H1
          element below; sub bumped 14-16 → 16-22; sub→card gap from 24px
          → 64px (mt-16). Search-card 4-layer white-rim shadow REMOVED per
          user "ths shadow sh makes it weird" (Fresha has zero shadow on
          this surface) — replaced with hairline border-s-border. */}
      {/* V3-D348 (tweak #1 — hero density): pt-16/20 -> pt-10/14 so the search
          card rises toward the fold. Paired with the smaller H1 + tighter
          sub->card gap below. */}
      {/* geometry sweep (2026-07-17, _geometry-triage.md #4, root of the page's
          largest off-grid cascade): px-[18px] -> px-4 (16), matching the
          site's standard mobile section inset (WalkInBand, BentoBusiness,
          business page sections all use px-4). */}
      {/* V3-D (2026-08-01, owner "why is homepage still that bro"): this whole block (wordmark
          row lives in Header.tsx, hidden the same way, headline, subline, 3-field SearchBar) is
          the "old hero" the task named. Mobile now renders HomeSearchPill below instead, matching
          the category-page chrome; desktop is untouched. */}
      <div className="max-md:hidden relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col justify-center px-4 pt-10 pb-2 md:px-8 md:pt-14 md:pb-16">
        <div className="w-full">
          {displayName && (
            // V2-D70 (2026-05-18): greeting weight bumped 500 medium → still 500
            // but now in Plus Jakarta Sans (single-family typography lock).
            <p className="mb-3 font-body text-[14px] md:text-[16px] font-medium text-s-ink-2 tracking-[-0.005em]">
              Hallo, {displayName}
            </p>
          )}
          {/* V3-D139 (2026-05-25): rotating slogans REMOVED per Fix 1+2 spec.
              H1 + sub-line are now locked, fixed strings — no rotation, no
              coupon CTA. Sub-line sits one tight gap below H1 (mb-3) and
              one full gap above SearchBar (sub p has mb-7) to preserve the
              prior heading-block → search gap. */}
          {/* V3-D176 (2026-05-26, council-informed): tracking + spacing
              tweaks per Hero variant B mock —
                - H1 tracking-normal → tracking-[-0.025em] (matches every
                  SectionTitle h2 + the Für dich h2)
                - Sub adds tracking-[-0.025em] (same)
                - Sub margin mb-7 (28px) → mb-3 (12px) — the previous
                  comment justified mb-7 as preserving "heading-block →
                  search gap", but matched against the rest of the page's
                  12-16px h2-to-content rhythm, 28px was an outlier that
                  made the Hero feel oversized. Tightening also pulls
                  more of the SearchCard above the fold. */}
          {/* V3-D177 (2026-05-26, council item #4): H1 max 64 → 52px.
              Mobile unchanged (clamp picks 10vw = ~40-50px there). Only
              affects ≥520px viewports where 10vw exceeds the cap. New
              52px cap gives a clean 2x typographic ladder to the first
              h2 (was 2.46x — H1 was bullying the rest of the page). */}
          {/* V3-D193 (2026-05-26): H1 weight 900 → 800 per user "too bold" sweep.
              Tracking widened slightly (-0.035 → -0.03em) to compensate for slightly
              less weight density. V3-D190 size kept.
              V3-D225 REVERTED 2026-05-27: user said "jst revrt monile n fix
              placements of stuff in pc dont touch mobile". Restoring original
              mobile size + weight. Desktop placement fix scoped via md: prefix
              elsewhere — H1 itself stays at original clamp. */}
          {/* V3-D327 (2026-05-27): Fresha-aligned hero. Council picked Fresha
              spec over Uber-aligned spec since Solen's actual category peer is
              Fresha. Measured Fresha values: H1 40px mobile / 64px desktop,
              weight 700, lh 1.1, RoobertPRO (we use Geist as closest free).
              Will wrap to 2 lines mobile (editorial weight, intended). */}
          {/* V3-D348 (tweak #1): H1 clamp 40/64 -> 30/44, leading 1.1 -> 1.08.
              Still the page's biggest type, but stops bullying the fold so the
              search is reachable without scrolling. */}
          <h1 className="mb-3 font-display text-[clamp(30px,8vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-s-ink">
            {t("instantlyConfirmed")}
          </h1>
          {/* V3-D327: Fresha sub 16px mobile / 22px desktop, weight 400, lh 1.3-1.4 */}
          {/* V3-D330: Hero sub tracking -0.015em → -0.005em per LOCKFILE §2.5 canonical Hero sub recipe. */}
          {/* RANGE_LAW A6 (2026-07-25): clamp(16px,4.5vw,22px) rendered 17.55px at the
              390px FLOORS viewport, an orphan size that didn't land on any locked bucket
              and was the 5th size inside the F7c densest-cluster window (12/14/15/17.55/18).
              Reused the SectionHeader H2 formula verbatim (SectionTitle in this file, and
              MobileCategoriesRow's own h2) so the sub-line snaps onto the existing
              section-H2 bucket (clamp(18px,2vw,20px)) instead of floating between it and
              body/CTA sizes. Weight/leading/tracking/color untouched. */}
          <p className="font-body text-[clamp(18px,2vw,20px)] font-normal leading-[1.35] tracking-[-0.005em] text-s-ink-2">
            Beauty &amp; Wellness in der ganzen Schweiz.
          </p>
        </div>

        {/* V3-D327 (2026-05-27): Fresha hero alignment — user "ths shadow sh
            makes it weird" + council picked "drop all shadow + hairline border."
            REMOVED the 4-layer white liquid-glass rim (V3-D91-fu3 archeology
            kept in git). On the current bg-s-bg-sunken (#F5F5F4) page bg, the
            white-on-grey card has natural separation; the shadow was noise.
            Sub→card gap bumped 12→64px (mt-16) to match Fresha's measured
            breathing room. Inner SearchBar provides its own border + radius. */}
        {/* V3-D348 (tweak #1): sub->card gap mt-16 (64px) -> mt-6/8 (24/32px).
            This 64px gap was the single biggest reason the search sat below
            the fold. */}
        <div className="relative rounded-[11px] mt-6 md:mt-8">
          <SearchBar />
        </div>

        {/* V3-D139-fix (2026-05-25): trust strip removed per user reversal —
            initially specced into hero, immediately retracted via selected-
            element "remove ths." Markup deleted (not commented) since the
            spec line itself was withdrawn. Conversion-lever concern voiced
            in chat; user proceeded with removal. */}
      </div>
      {/* mockup-ok: structural move, no appearance change, see comment below.
          V3-D (2026-08-01): mobile-only search pill lives in page.tsx now, directly below this
          </Hero>. See HomeSearchPill.tsx for the full rationale, desktop keeps the block above
          unchanged.
          FIX B (2026-08-01, owner "it should be search bar instead of category bar"): the sticky
          wrapper MOVED out of this file into page.tsx (a sibling of the whole <Hero/>, right
          below it), not rendered here. Measured: this <section> carries `overflow-hidden` and on
          mobile is only as tall as the pill itself (the desktop block above is `max-md:hidden`),
          so a sticky child nested inside it could only stay pinned for the ~80px scroll distance
          of the section's OWN box, then scroll away with the rest of the page well before the
          feed the owner actually scrolls through. page.tsx's root wrapper spans the ENTIRE home
          page (Hero + FeedZone), so the identical sticky div nested there stays pinned for the
          whole scroll, matching SearchTemplate's own pill (whose sticky ancestor also spans its
          full results list, never a short local section). */}
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
        flex w-full max-w-[540px] flex-col rounded-2xl border border-s-border bg-white p-2
        shadow-[0_20px_40px_rgba(50,47,44,0.04)]
        max-md:mx-auto
        md:max-w-none md:flex-row md:items-stretch md:rounded-full md:p-[6px_6px_6px_8px]
        md:shadow-[0_30px_60px_rgba(50,47,44,0.05)]
      "
    >
      {/* Service — active by default to telegraph affordance */}
      <SearchRow
        icon={<Search size={18} strokeWidth={1.9} />}
        label="Service suchen"
        value="Service"
        isPlaceholder
        isActive
        isFirst
      />

      <SearchRow
        icon={<MapPin size={18} strokeWidth={1.9} />}
        label="Standort wählen"
        value="Stadt"
        isPlaceholder
      />

      <SearchRow
        icon={<Calendar size={18} strokeWidth={1.9} />}
        label="Zeit wählen"
        value="Zeit"
        isPlaceholder
      />

      {/* Submit — brand-teal bg, hover lighter brand-mid. Full-width on mobile,
          pill on right desktop. (Was bg-s-ink default → hover bg-s-ink;
          flipped 2026-05-09 per user feedback — black felt out of place
          when the rest of the page already pulls toward brand-teal.) */}
      <button
        type="button"
        className="
          font-body shrink-0 rounded-full border-0 bg-s-ink p-4 font-semibold text-white transition-colors
          hover:bg-black
          md:px-7
        "
      >
        Termine finden
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
        ${isActive ? "bg-s-bg-sunken" : ""}
        ${!isFirst ? "border-t border-s-border max-md:border-t md:border-t-0" : ""}
        md:flex-1 md:rounded-full md:border-t-0 md:p-[14px_22px]
      `}
    >
      {/* Icon column — right-bordered to create the vertical divider */}
      <span className="flex shrink-0 items-center justify-center pr-3 text-s-ink-2 border-r border-s-border">
        {icon}
      </span>
      {/* Value column — left-padded so text sits "a little away" from the line */}
      <span
        className={`
          font-body min-w-0 flex-1 truncate text-base text-s-ink-2 pl-4
          ${isPlaceholder ? "font-normal" : "font-medium"}
        `}
      >
        {value}
      </span>
    </button>
  );
}
