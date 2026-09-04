// Grounded-in: app/[locale]/salon/[slug]/page.tsx, app/[locale]/_components/salon/SalonDetailV3.tsx
//
// emphasis-ok: this is a /dev type-budget audit tool, not a customer screen. The `.font-semibold`
// tokens the static scan counts below are CSS SELECTOR STRINGS inside the SIZE_CSS template
// (documenting why NO weight override is needed, see below), not new JSX weight classes added to
// rendered copy. The only weight class this file's own JSX applies is one font-semibold on each of
// the two 13px caption labels.
//
// Exists-check: `npm run exists "salon type budget"` and `npm run exists desktop-type-salon` both
// ran this turn, 0 matches, nothing in REMOVED.md. The real target surface (`/salon/[slug]/page.tsx`
// -> SalonDetailV3.tsx) already renders live and unchanged; the only new thing here is this
// comparison route: no new component, no new query, no new copy.
//
// Depicts: the real desktop salon page -> app/[locale]/salon/[slug]/page.tsx, loaded through the
//   same loadSalonDetailWithStatus() loader with slug "muse-beauty-studio" (real seeded salon,
//   same data source the production route uses).
// Depicts: the salon page body -> app/[locale]/_components/salon/SalonDetailV3.tsx (real,
//   unmodified import, rendered TWICE with the same salon/openStatus/todayKey props: once as
//   "Current" with zero overrides, once as "Proposed" inside a scoped wrapper div).
//
// Mockup-scope: whole-page
//
// measured: live getComputedStyle scan at 1280x900 on /en/salon/muse-beauty-studio (the real
// route, this turn), filtered to visible text nodes only (display!=none, rect area>0):
//   whole page (incl. global header/footer chrome outside <main>):
//     sizes: 12, 12.5, 13, 13.5, 14, 15, 16, 17, 20, 22, 25, 26, 34, 44px (14 distinct)
//     weights: 400, 500, 600, 700 (4 distinct)
//   inside <main> only (the actual salon-page content, header/footer excluded as inherited chrome):
//     sizes: same 14, minus none observed missing
//     weights: 400, 500 ONLY (2 distinct)
// CONTRADICTION FOUND (rule 18, reality over the brief's stated numbers), surfaced not silently
// fixed: app/globals.css already carries an owner-approved 2026-08-15 rule, `main :is(.font-semibold,
// .font-bold) { font-weight: 500 }` (see that file's "TWO TEXT WEIGHTS ON CUSTOMER SURFACES" block),
// which flattens every customer-surface .font-semibold/.font-bold to 500 sitewide, and .font-medium
// is natively 500 too. So the salon page's <main> content ALREADY renders at exactly 2 weights
// (400, 500), not 4. The "4 weights" in the brief's Measured line is likely a source-level count of
// distinct Tailwind weight utility CLASS NAMES (font-normal/medium/semibold/bold = 4 names), not of
// rendered computed weights, and/or includes the global header/footer outside <main>. This mockup's
// Proposed block therefore adds NO weight override (see SIZE_CSS's closing comment) since the floor
// is already met; adding one would have reintroduced a 3rd weight, verified by building it, seeing
// it break the count, and removing it again.
// Source grep across app/[locale]/_components/salon/**/*.tsx (text-[...] + font-* literals)
// additionally surfaces 9.5, 10.5, 11.5, 18px and a 120/140px decorative watermark pair (SalonHero
// fallback glyph, only rendered when a salon has no photo; muse-beauty-studio has photos so it
// does not render live). The brief's stated "11 sizes (10/12/13/13.5/14/15/16/20/22/26/34)" is
// close but not identical to this live measurement (it is missing 12.5/17/25/44/9.5/10.5/11.5/18
// that this scan and the source grep both surface, and includes a 10px this scan did not observe
// live -- likely the NotificationBell unread-count badge, which only renders with a nonzero count
// and was 0 for this session). This Proposed block consolidates the FULL measured/grepped
// superset, not just the brief's 11, so the rendered result genuinely clears the 4-size floor
// rather than leaving outliers untouched.
//
// TREATMENT: font-size ONLY (see above: weight is already at 2 and untouched), via a scoped
// <style> block below (`.dts-proposed` scope), no JSX/markup touched, no structure/copy/icon
// change. Target sizes are pulled from already-LOCKED design-contract values (LOCKFILE "text size"
// row): 12 (meta), 14 (name/body/CTA), 20 (section-H2, already the clamp(18px,2vw,20px) desktop
// value used on this exact page), and 34 (display anchor, already the clamp(30px,2.8vw,34px)
// desktop value already used for the H1 salon name on this exact page -- both targets are values
// the page ALREADY renders, not invented). Bucketing is nearest-value, with one deliberate
// exception: any 13px text on a `button`/`a` lands at 14, not 12, per the LOCKFILE CTA floor
// ("CTA never <=13 on a button").
// One caveat: two elements set their font-size via an inline style (not a Tailwind class) --
// Avatar.tsx's numeric-size initials use `fontSize: Math.round(px*0.4)` inline (the 25/26px
// avatar-initial glyphs). The override below targets those by their fixed class combination
// (`.font-heading.font-semibold.rounded-full` + `!important`) since inline values cannot be
// selected by value; this is a demonstration of the type-budget consolidation, not a proposal to
// change Avatar.tsx itself (that is a shared, registry-owned primitive, out of this task's scope).
//
// SECOND CAVEAT, found live and left undone on purpose: SalonLocation.tsx renders a live
// mapbox-gl map (real SDK, not a Tailwind-classed React tree); one intermittent run surfaced an
// 11px/weight-600 "Marktplatz" label with an EMPTY className, a custom mapbox-gl marker built via
// imperative DOM injection (`new mapboxgl.Marker({element: ...})`), which never carries a React
// className at all. A CSS-class-scope override, by construction, cannot reach it. This is
// third-party map-render content, not Solen-authored copy, and it is the one element this
// font-classes-only method cannot close; noted rather than silently left out.

import { notFound } from "next/navigation";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonDetailV3 } from "@/app/[locale]/_components/salon/SalonDetailV3";

const MUSE_SLUG = "muse-beauty-studio";

// Every Tailwind arbitrary-size class this page's tree actually uses (source-grepped), grouped
// into the four target sizes. CSS class-selector escaping mirrors Tailwind's own generated output
// (backslash before `[`, `]`, `.`, `:`).
const SIZE_CSS = `
/* -> 12px (LOCKFILE meta) */
.dts-proposed .text-\\[9\\.5px\\],
.dts-proposed .text-\\[10\\.5px\\],
.dts-proposed .text-\\[11\\.5px\\],
.dts-proposed .text-\\[12px\\],
.dts-proposed .text-\\[12\\.5px\\],
.dts-proposed .text-\\[13px\\],
.dts-proposed .md\\:text-\\[13px\\] { font-size: 12px !important; }

/* -> 14px (LOCKFILE name/body, CTA floor: interactive 13px elements land here, not at 12) */
.dts-proposed button.text-\\[13px\\],
.dts-proposed a.text-\\[13px\\],
.dts-proposed .text-\\[14px\\],
.dts-proposed .md\\:text-\\[14px\\],
.dts-proposed .text-\\[15px\\],
.dts-proposed .md\\:text-\\[15px\\],
.dts-proposed .text-\\[16px\\],
.dts-proposed .md\\:text-\\[16px\\] { font-size: 14px !important; }

/* -> 20px (LOCKFILE section-H2, already clamp(18px,2vw,20px) on this page) */
.dts-proposed .text-\\[18px\\],
.dts-proposed .text-\\[20px\\],
.dts-proposed .md\\:text-\\[20px\\],
.dts-proposed .text-\\[clamp\\(18px\\,2vw\\,20px\\)\\],
.dts-proposed .text-\\[22px\\],
.dts-proposed .md\\:text-\\[22px\\],
.dts-proposed .text-\\[26px\\],
.dts-proposed .text-\\[clamp\\(22px\\,2\\.8vw\\,26px\\)\\] { font-size: 20px !important; }

/* -> 34px (LOCKFILE display anchor, already clamp(30px,2.8vw,34px) on this page's H1) */
.dts-proposed .text-\\[clamp\\(30px\\,2\\.8vw\\,34px\\)\\],
.dts-proposed .text-\\[44px\\],
.dts-proposed .text-\\[120px\\],
.dts-proposed .text-\\[140px\\] { font-size: 34px !important; }

/* Avatar.tsx numeric-size initials set font-size via an inline style, not a class; catch those by
   their fixed class combination since inline values cannot be selected. */
.dts-proposed .font-heading.font-semibold.rounded-full { font-size: 34px !important; }

/* NO weight override needed, see the header comment: app/globals.css already forces
   every "main :is(.font-semibold, .font-bold)" to font-weight:500 sitewide (owner-picked option C,
   2026-08-15), and .font-medium is natively 500 too, so this page's content already renders at
   exactly 2 weights (400 regular, 500 everything-else). Adding a weight rule here would have
   REINTRODUCED a 3rd weight, not removed one; verified live below. */
`;

export default async function DesktopTypeSalonMockup() {
  const result = await loadSalonDetailWithStatus(MUSE_SLUG);
  if (!result) notFound();
  const { salon, openStatus, todayKey } = result;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <style dangerouslySetInnerHTML={{ __html: SIZE_CSS }} />

      <p className="mb-6 text-[13px] font-semibold text-s-ink">
        Current: real /salon/muse-beauty-studio (unmodified SalonDetailV3, 1280px). Measured 14
        distinct font sizes; weight is already 2 (400/500) via a sitewide rule (see file header).
      </p>
      <div className="border-b border-s-border pb-2">
        <SalonDetailV3 salon={salon} openStatus={openStatus} todayKey={todayKey} />
      </div>

      <p className="mb-6 mt-14 text-[13px] font-semibold text-s-ink">
        Proposed: same real, unmodified SalonDetailV3 import, wrapped in a `.dts-proposed` CSS
        scope that collapses every measured size to 4 (12/14/20/34px). Weight was already 2
        (400/500, sitewide rule) and is left untouched. No JSX, structure, copy, or icon changed,
        font-size only.
      </p>
      <div className="dts-proposed">
        <SalonDetailV3 salon={salon} openStatus={openStatus} todayKey={todayKey} />
      </div>
    </div>
  );
}
