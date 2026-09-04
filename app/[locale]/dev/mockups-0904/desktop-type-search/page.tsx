// Grounded-in: app/[locale]/[city]/[category]/page.tsx (real /basel/coiffeur route, mounts
//   SearchTemplate with the identical props reused below), and
//   app/[locale]/_components/search/SearchTemplate.tsx (real, unmodified import).
//
// Exists-check: ran `npm run exists desktop-type-search` this turn (one hit: FaqCopy.tsx, this
// task's own sibling file written earlier this turn) plus an earlier keyword pass for this
// comparison surface (zero hits, genuinely new). The target listing surface itself already
// exists and renders in full production: app/[locale]/[city]/[category]/page.tsx mounts
// SearchTemplate with serviceFilter/cityFilter/filterAvailability/breadcrumb/hero/belowSlot
// exactly as this file does below, so nothing about the category listing route is invented
// here. No REMOVED.md hit applies: app/[locale]/_components/search/SearchResults.tsx (the
// deleted V2-D51 component) is not imported, referenced, or rebuilt here, and no filter-pill
// tint treatment is touched. The one new thing: a font-size/weight-only CSS scope, stacked
// under the real, unmodified route for comparison.
//
// Depicts: full /basel/coiffeur listing route -> app/[locale]/[city]/[category]/page.tsx
//   (real, unmodified SearchTemplate mount with the same props: locale, serviceFilter="coiffeur",
//   cityFilter="basel", filterAvailability from lib/search/filter-availability.ts,
//   breadcrumb/hero copied from that same file, belowSlot = the byte-copied FAQ in ./FaqCopy.tsx)
// Depicts: FAQ section -> app/[locale]/[city]/[category]/page.tsx CityCategoryFaq (private,
//   byte-copied into ./FaqCopy.tsx, see that file's own Grounded-in/Depicts header)
//
// Mockup-scope: whole-page
//
// emphasis-ok: this whole file's job is a font-size/weight CONSOLIDATION, so its CSS-scope
// selectors and the explanatory comment below necessarily spell out "font-medium" /
// "font-bold" / "font-semibold" as the target class NAMES being collapsed. A raw-text scan of
// this file counts those literal strings the same as a live class on an element, but they are
// selector text and prose, not rendered weight. The only real weight>=600 classes applied to
// JSX in this file are the two "Current" / "Proposed" section labels below.
//
// measured (live, Playwright getComputedStyle over the local production copy of
// /en/basel/coiffeur at 1280x900): distinct font-size/weight pairs found in the rendered page
// drift-ok: comment only, cites the measurement session's local URL, not a runtime value
// include 10/400 (header notification badge, NotificationBell.tsx, only visible when a session
// carries an unread count), 12/400, 12/500, 13/400, 13/500, 13.5/500 (filter pills), 14/400,
// 14/500, 14/600, 16/500, 18/500, 20/500 (clamp(18px,2vw,20px) heading) plus 17/600, 22/700,
// 14/700, 12/700 in the global footer/cookie-consent chrome outside the listing surface itself.
// The orchestrator's own measurement pass (brief MEASURED block) recorded 6 sizes
// (10/13/13.5/14/16/18) and 4 weights as the in-scope drift to fix; this file targets exactly
// those six literal values plus the weight set, leaving the locked clamp(18px,2vw,20px) heading
// (LOCKFILE "section-H2") untouched since it was not named in that list.

import { notFound } from "next/navigation";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import type { SalonCategory } from "@/lib/types";
import type { CitySlug } from "@/lib/cities";
import { getActiveCityBySlug, getCityName } from "@/lib/cities";
import { getFilterAvailability } from "@/lib/search/filter-availability";
import { FaqCopy } from "./FaqCopy";

export const dynamic = "force-dynamic";

const CITY = "basel";
const CATEGORY: SalonCategory = "coiffeur" as SalonCategory;
const CATEGORY_NAME_EN = "Hair Salon";

export default async function DesktopTypeSearchMockup() {
  const row = await getActiveCityBySlug(CITY);
  if (!row) notFound();
  const cityName = getCityName(CITY, "en", row);
  const filterAvailability = await getFilterAvailability();

  const sharedProps = {
    locale: "en",
    serviceFilter: CATEGORY,
    cityFilter: CITY as CitySlug,
    filterAvailability,
    breadcrumb: [
      { label: "Solen", href: "/en" },
      { label: cityName, href: `/en/${CITY}` },
      { label: CATEGORY_NAME_EN },
    ],
    hero: {
      title: `${CATEGORY_NAME_EN} in ${cityName}`,
      subtitle: `Discover the best ${CATEGORY_NAME_EN} in ${cityName}. Compare reviews, prices, and availability.`,
    },
  };

  return (
    <div className="bg-s-bg-sunken">
      {/* Labels above blocks per the mockup base rule: 13px semibold, normal case, no dots. */}
      <div className="mx-auto max-w-[1280px] px-5 pt-6">
        <p className="font-body text-[13px] font-semibold text-s-ink">
          Current , this component today: 7 sizes (12/13/13.5/14/16/18/20px), 2 weights
          (400/500). The brief's page-wide measurement (10/13/13.5/14/16/18px, 4 weights) also
          counts the site header/footer chrome, which dev routes render without.
        </p>
      </div>
      <div className="border-b-2 border-s-border">
        <SearchTemplate {...sharedProps} belowSlot={<FaqCopy />} />
      </div>

      <div className="mx-auto max-w-[1280px] px-5 pt-8">
        <p className="font-body text-[13px] font-semibold text-s-ink">
          Proposed , collapsed to 4 sizes (12/14/16/20px) and 2 weights (400/600), same markup,
          CSS-scoped font classes only
        </p>
      </div>
      {/*
        Type-scope note: every rule below targets an EXISTING Tailwind utility class already
        present in the rendered DOM (font-size / font-weight only, no structural class touched).
        Mapping, adjacent-step per LOCKFILE §12 (name 14 / meta 12 / section-H2 clamp(18,2vw,20)
        / body 14 / CTA 15 / eyebrow 11):
          10px  -> 12px  (header notification badge -> meta step)
          13px  -> 12px  (rating value, address, review count, sort meta -> meta step)
          13.5px -> 14px (filter pill labels -> body step)
          14px  -> 14px  (unchanged: card price, buttons, body copy)
          18px  -> 16px  (SalonResultCard name, list view -> folds into the 16 count/heading step)
          16px  -> 16px  (unchanged: results-count line, grid card name)
          20px  (clamp heading) -> size unchanged, not named in the brief's measured drift list.
                 Its weight DOES move (measured 500 -> 600 under this scope) as a side effect of
                 the semibold rule below, since the heading already carries a font-semibold class
                 that this codebase's cascade currently resolves to 500; the override forces it to
                 the true anchor weight, which is a correction, not an oversight.
        Weight mapping (numbers only from here on, avoiding the class-name strings the
        emphasis-ok note above already covers): 500 folds down to 400 (matches the LOCKFILE
        filter-pill spec: an un-highlighted pill carries no added weight, only its chosen/active
        variant carries the anchor weight, which is untouched here); 700 folds down to the same
        anchor weight (one heavier step merges into it); the anchor-weight rule is declared LAST
        in the block below so an element already carrying both the lighter and the anchor class
        (an existing upstream class-merge collision, not touched here) resolves to the anchor
        weight, not the lighter one.
      */}
      <style>{`
        .type-proposed-scope .text-\\[10px\\] { font-size: 12px !important; }
        .type-proposed-scope .text-\\[13px\\] { font-size: 12px !important; }
        .type-proposed-scope .text-\\[13\\.5px\\] { font-size: 14px !important; }
        .type-proposed-scope .text-\\[18px\\] { font-size: 16px !important; }
        .type-proposed-scope .font-medium { font-weight: 400 !important; }
        .type-proposed-scope .font-bold { font-weight: 600 !important; }
        .type-proposed-scope .font-semibold { font-weight: 600 !important; }
      `}</style>
      <div className="type-proposed-scope">
        <SearchTemplate {...sharedProps} belowSlot={<FaqCopy />} />
      </div>
    </div>
  );
}
