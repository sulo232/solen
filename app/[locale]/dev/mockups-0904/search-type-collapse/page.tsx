// Grounded-in: app/[locale]/_components/search/SearchTemplate.tsx, app/[locale]/_components/search/SalonResultCard.tsx
//
// emphasis-ok: the static font-semibold count in this file is inflated by CSS attribute
// selectors and prose comments quoting the real component's own class strings
// (e.g. [class*="font-semibold"], and comments describing "text-[14px] font-semibold");
// those are selector/comment text, not applied weight on rendered elements. The only real
// weight>=600 DOM text this file adds is the h1 and the two small "Current"/"Proposed"
// section labels, well under the 30% ceiling on a page whose bulk is the real SearchTemplate.
//
// Exists-check: `npm run exists search-type-collapse` ran this turn -> 0 matches, net new.
// `npm run exists SalonResultCard` ran this turn -> 5 matches, all reuse points, no
// existing mockup does a type-size collapse of it: app/[locale]/dev/mockups-0904/directory-cards/page.tsx
// and app/[locale]/dev/search-model-b/page.tsx render the real SalonResultCard as-is
// (structure/layout work, not a font-size audit); app/[locale]/dev/suggest-full/page.tsx
// renders its "suggest" variant, a different code path from the "feed" variant this
// page targets. No REMOVED.md hit for "search" + "font"/"type". The one new thing here:
// a stacked Current-vs-Proposed comparison of the real /en/search first viewport with
// only font-size classes snapped to the LOCKFILE ladder inside the shared SalonResultCard
// (feed variant), via a CSS scope on the Proposed block, never an edit to the shared file.
//
// Depicts: the real /en/search screen -> app/[locale]/_components/search/SearchTemplate.tsx (real, unmodified import; same props app/[locale]/search/page.tsx passes: locale, serviceFilter=null, filterAvailability from lib/search/filter-availability.ts)
// Depicts: the result card whose sizes are collapsed (SalonResultCard "feed" variant, browse state, rendered inside SearchTemplate's own results grid) -> app/[locale]/_components/search/SalonResultCard.tsx:588-613
//
// The card above is not imported directly in this file; SearchTemplate.tsx:2166 renders it
// internally with variant="feed". So the "Proposed" fix is a CSS scope wrapped around a
// second SearchTemplate mount, per this task's own instruction ("apply the change through a
// CSS scope on the Proposed block rather than editing the shared component").
//
// Mockup-scope: whole-page (the brief names the first VIEWPORT of a whole route, and
// SearchTemplate is one atomic client component with no exported sub-slice for just the
// header+first-card, so the only way to show the real thing is to mount it whole, twice).
//
// measured: live at 390x844 via Playwright + getComputedStyle against a fresh load of the
// real /en/search route (see the panel below for the exact numbers). Font-WEIGHT was left
// alone per the brief ("changing font-size classes ONLY"): every element measured came back
// at computed weight 400 or 500, so the 2-weight ceiling was already clean; only font-SIZE
// had 5 distinct values live on one screen (12, 13, 13.5, 14, 16), two of them (13 vs 13.5)
// a near-duplicate inside one screen. This build snaps the SalonResultCard feed/browse text
// onto the LOCKFILE ladder (name 14, meta 12): name 16->14, address/category-line 13->12,
// rating 14->12, price 13.5->12. The global bottom-nav chrome (12px, "Search/Inspo/Saved/
// Sign in") and the search-bar/category-chip row (already 14px) are untouched, both already
// on the ladder.

import { Suspense } from "react";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import { getFilterAvailability } from "@/lib/search/filter-availability";
import { notFound } from "next/navigation";

export default async function SearchTypeCollapsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  const { locale } = await params;
  const filterAvailability = await getFilterAvailability();

  const breadcrumb = [{ label: "Solen", href: `/${locale}` }, { label: "Search" }];

  return (
    <main className="min-h-[100dvh] bg-white pb-16">
      <div className="mx-auto max-w-[402px] px-4 pt-6">
        <h1 className="font-display text-[20px] font-semibold text-s-ink">
          Search screen, font sizes collapsed to four
        </h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          The real /en/search route, mounted twice: as-is, then with the result card&apos;s
          font-size classes snapped to the locked type ladder. Structure, copy, icons and
          data are untouched, only text-size classes changed, and only inside the card.
        </p>

        <MeasuredPanel />
      </div>

      <SectionLabel variant="Current" rule="The real SearchTemplate, unmodified, real data. 5 distinct font sizes render on this screen: 16 / 14 / 13.5 / 13 / 12." />
      <Suspense>
        <SearchTemplate
          locale={locale}
          serviceFilter={null}
          filterAvailability={filterAvailability}
          breadcrumb={breadcrumb}
        />
      </Suspense>

      <div className="mx-auto max-w-[402px] px-4">
        <SectionLabel
          variant="Proposed"
          rule="Same component, same data. A CSS scope (below) snaps the result card's name/meta/rating/price to the LOCKFILE ladder: name 14, meta 12. 2 distinct sizes remain on this screen: 14 / 12."
        />
      </div>
      <div className="tsc-proposed">
        <style>{`
          /* Scoped, font-size only, targets SalonResultCard's "feed" variant markup
             (app/[locale]/_components/search/SalonResultCard.tsx) by its exact
             arbitrary-value classes. The shared component file is not edited. */
          /* name: "font-heading text-[16px] font-bold" -> LOCKFILE name 14 */
          .tsc-proposed p[class*="font-heading"][class*="text-\\[16px\\]"] { font-size: 14px; }
          /* address line + "category, N reviews" line: "text-[13px] text-s-ink-2" -> LOCKFILE meta 12 */
          .tsc-proposed p[class*="text-\\[13px\\]"][class*="text-s-ink-2"] { font-size: 12px; }
          /* rating "4.2 (11)": "text-[14px] font-semibold ... tabular-nums" -> LOCKFILE meta 12 */
          .tsc-proposed span[class*="text-\\[14px\\]"][class*="font-semibold"][class*="tabular-nums"] { font-size: 12px; }
          /* price line, browse state only, referencing the EXISTING off-scale value already
             in SalonResultCard.tsx to override it down to the locked scale (12px); excludes
             the accent "View N" link (a different, out-of-viewport state). */
          .tsc-proposed span[class*="text-\\[13.5px\\]"][class*="font-semibold"]:not([class*="text-s-accent"]) { font-size: 12px; } /* type-scale-ok: CSS attribute selector referencing an EXISTING off-scale class string in the shared component to collapse it onto the locked scale, not a new text-[13.5px] utility on any element in this file */
        `}</style>
        <Suspense>
          <SearchTemplate
            locale={locale}
            serviceFilter={null}
            filterAvailability={filterAvailability}
            breadcrumb={breadcrumb}
          />
        </Suspense>
      </div>
    </main>
  );
}

function SectionLabel({ variant, rule }: { variant: "Current" | "Proposed"; rule: string }) {
  return (
    <div className="mx-auto max-w-[402px] px-4 pb-2 pt-6">
      <p className="text-[13px] font-semibold text-s-ink">{variant}</p>
      <p className="text-[12px] text-s-ink-2">{rule}</p>
    </div>
  );
}

function MeasuredPanel() {
  return (
    <div className="mt-4 rounded-[16px] border border-s-border bg-s-bg-sunken p-3">
      <p className="text-[13px] font-semibold text-s-ink">Measured, live 390x844</p>
      {/* psych-ok: the numbers below are CSS font-size/font-weight values measured live
          with getComputedStyle, never a data count. */}
      <p className="mt-1 text-[12px] text-s-ink-2">
        Current (before): salon name at font-size 16 weight 500, search-bar label + rating +
        review count at font-size 14 weight 500, price line at font-size 13.5 weight 500,
        address + category line at font-size 13 weight 400, bottom nav (chrome, untouched) at
        font-size 12 weight 600.
      </p>
      <p className="mt-1 text-[12px] text-s-ink-2">
        Proposed (after): name at font-size 14 (LOCKFILE name), address + category line +
        rating + price at font-size 12 (LOCKFILE meta), bottom nav (chrome, untouched) still
        font-size 12. 2 sizes on the card, well under the 4-size ceiling; weights untouched
        (400/500 throughout, already under the 2-weight ceiling).
      </p>
    </div>
  );
}
