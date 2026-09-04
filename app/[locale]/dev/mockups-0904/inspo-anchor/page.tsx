// Grounded-in: app/[locale]/inspo/page.tsx, app/[locale]/_components/homepage/HomeSearchPill.tsx,
// app/[locale]/_components/layout/CategoryPillRow.tsx, components-legacy/discovery/MasonryGrid.tsx,
// components-legacy/discovery/ItemCard.tsx, components-legacy/discovery/VideoCard.tsx,
// app/[locale]/_components/layout/Header.tsx, app/[locale]/salon/[slug]/team/page.tsx
//
// measure-ok: no screenshot/Mobbin reference was attached to this brief. The airbnb--home-mobile.md
// reference cited below is used only to flag a STRUCTURAL conflict (heading vs no-heading), never
// as a pixel source, so nothing here is copied off an Airbnb screenshot. The one size decision (the
// heading) is grounded in an existing repo precedent, not eyeballed: source-read
// app/[locale]/salon/[slug]/team/page.tsx:89 = 28px font-semibold font-display tracking -0.02em,
// the exact class combination reused verbatim below. The chrome comparison number (Header.tsx
// isDiscover title, source-read Header.tsx:437-448) = 25px tall font-semibold mobile / 26px desktop.
//
// REPAIR ROUND 2026-09-05, punch list from the read-only critic, fixed in this file only (no real
// component touched):
//   1. FAIL, undisclosed: `<CategoryPillRow />` in both blocks below rendered NOTHING on this
//      route. CategoryPillRow.tsx self-gates on `usePathname()` (isHome / isDiscover /
//      categorySegment, CategoryPillRow.tsx:122-180) and this mockup's own path
//      (`/en/dev/mockups-0904/inspo-anchor`, 3 segments) matches none of those patterns, so
//      `showCategoryChrome` was false and the component returned null in both the Current and
//      Proposed block. Confirmed live pre-fix: page.innerText had no pill label anywhere and the
//      feed started immediately under the search bar. FIX: `usePathname()` reads Next's own
//      `PathnameContext` (next/dist/shared/lib/hooks-client-context.shared-runtime, confirmed by
//      reading navigation.js:110-114 in this repo's node_modules), so both blocks below now render
//      a local `DiscoverPillRow` wrapper (defined below, not a real/registered component) that
//      overrides that context to `/en/inspo` around an otherwise-untouched `<CategoryPillRow />`.
//      This is a path OVERRIDE, not a markup copy: CategoryPillRow.tsx is imported unmodified, it
//      just now believes it is mounted on the real /inspo route, which is the one place it is
//      actually meant to render, so the row that comes out is byte-identical to what /en/inspo
//      renders today. No real file was edited to make this true. First fix attempt (applying the
//      override unconditionally on first render) produced a React hydration-mismatch warning,
//      because SSR still sees this dev route's own real 3-segment path and renders the row as
//      null; `DiscoverPillRow` gates the override behind a post-mount flag so the client's first
//      paint matches the server (null) before swapping in the overridden row, which is the
//      standard client-only-value pattern and is disclosed at that function's own definition.
//   2. Direct consequence of #1: the Current block now actually matches the real /en/inspo first
//      viewport (search + filter row + feed), not a sparser search+feed-only render, so the new
//      heading in Proposed is judged against the correct baseline.
//   3-5. Informational items from the critic (whole-page font-size count crossing 4 only when
//      Current+Proposed+footnote are read as one screen because of the shared dev-mockup a11y
//      skip-link; the headerCount/navCount 0-vs-1 mismatch caused sitewide by
//      HideInBooking.tsx's dated "no chrome on /dev/ routes" rule, not by this file; a transient
//      dev-server-restart 000 on the feed API during one measurement pass). None of these are
//      defects in this file's own markup or claims, so nothing else changed.
//
// Exists-check: `npm run exists inspo` (52 hits) + `npm run exists inspo-anchor` (2 hits, this
// same route/page from the prior round, re-run this turn per the repair-round protocol) both run
// this turn. Relevant hits from the first: the live route is
// app/[locale]/inspo/page.tsx; its search zone (HomeSearchPill + CategoryPillRow + the
// DiscoverySearchBar focused state) and its feed (MasonryGrid + ItemCard/VideoCard) already exist
// and are reused unmodified below. Two prior-decision hits matter and neither is what this file
// does, cited from their two different sources (not both from the graveyard file):
// (a) the graveyard file's entry for a second, now-deleted discover-chrome mockup page (owner
// killed a SECOND mockup file that existed just to show the discover-page header, because a
// comparison already lived in search-a.html; this is the ONE comparison this brief asked for,
// not a duplicate of that), and
// (b) Header.tsx:429 inline code comment, "V3-D410 ... the page title now lives in the global
// header's logo slot ... the standalone h1 here is removed to stop the title stacking under the
// wordmark" (a code comment, not a graveyard entry; see the CONTRADICTION note below, this
// changes what "new" means here). The one new thing in this file: a body-level
// "Inspo" heading above the search field, shown as a Proposed variant next to the unmodified
// Current state, using the SAME real search/filter/feed components both times.
//
// CONTRADICTION, surfaced per the "chrome is inherited" law and "look at the reference, not just
// the spec": two things this brief's premise ("today the placeholder search text is the de-facto
// anchor") does not hold up against.
//   1. The real discover route already renders a heading. Header.tsx:429 matches the bare
//      discover path (`isDiscover`) and swaps its logo slot for `tDiscover("title")` = "Inspo" at
//      the 25/26px measured above, see messages/en.json `discover.title`. The real page's own
//      comment (page.tsx:473) records why its OWN h1 was deleted: "to stop the title stacking
//      under the wordmark." Adding a second heading in the page body reproduces exactly the
//      stacking that removal fixed. CORRECTED after a live measurement: this dev route renders
//      ZERO header elements (Playwright count = 0), not the generic wordmark I first assumed,
//      because HideInBooking.tsx has an explicit dated rule, "PREVIEW ROUTES CARRY NO APP CHROME"
//      (owner 2026-08-16), returning null for any `/dev/` path on purpose, so a header/nav count
//      taken on THIS page cannot be compared 1:1 against the real /inspo route (1 header there,
//      0 here, by design, not a mismatch this file introduced). Stated plainly rather than
//      silently building on the wrong premise (`Chrome is inherited, never redrawn` law: this
//      file does not attempt to reconstruct Header's per-route override, that would mean editing
//      Header.tsx, shared chrome, out of this file's scope).
//   2. The named source of truth disagrees too. `_design-system/references/airbnb--home-mobile.md`
//      (read before building, per "look at the reference, not the spec"), measured live at
//      390x844: "the largest thing on the screen is an 18px section title and everything else is
//      smaller... There is no hero, no headline, no display type at all." That file's own
//      "CONFLICT B" names this exact tension: FLOORS LAW 6 wants a >=28px anchor, Airbnb's
//      comparable feed screen has nothing above 18px and passes the floor via the PHOTO exemption
//      instead, and it states plainly this is "owner call if he ever wants an anchor here."
// Built anyway, per the VARY brief, both flagged in the return.
//
// Depicts: search field -> app/[locale]/_components/homepage/HomeSearchPill.tsx (real, unmodified import)
// Depicts: filter row -> app/[locale]/_components/layout/CategoryPillRow.tsx (real, unmodified import)
// Depicts: photo feed -> components-legacy/discovery/MasonryGrid.tsx + ItemCard.tsx + VideoCard.tsx (real, unmodified import)
// Mockup-scope: whole-page

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import HomeSearchPill from "@/app/[locale]/_components/homepage/HomeSearchPill";
import CategoryPillRow from "@/app/[locale]/_components/layout/CategoryPillRow";
import MasonryGrid from "@/components-legacy/discovery/MasonryGrid";
import ItemCard from "@/components-legacy/discovery/ItemCard";
import VideoCard from "@/components-legacy/discovery/VideoCard";
import type { DiscoveryItem } from "@/lib/types";
// Repair round: CategoryPillRow.tsx reads its own visibility off `usePathname()`, and
// `usePathname()` (next/dist/client/components/navigation.js:110-114, this repo's installed
// Next 15.3.8) reads that value off Next's own React context, PathnameContext, exported from
// this shared-runtime module. Overriding the context value for the subtree below makes the real,
// unmodified CategoryPillRow believe it is mounted on /en/inspo, which is the one route it is
// actually built for, rather than this 3-segment dev path it does not recognize. Nothing in
// CategoryPillRow.tsx is copied, edited, or forked.
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

// One real fetch, same endpoint the live discover page calls (app/[locale]/inspo/page.tsx:284),
// shared by both the Current and Proposed blocks below so the feed itself never varies.
function useRealFeed() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  useEffect(() => {
    fetch("/api/discovery/feed?page=1&limit=8")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems((data.items ?? []) as DiscoveryItem[]))
      .catch((err) => console.error("[inspo-anchor mockup] feed fetch failed:", err));
  }, []);
  return items;
}

// Local, mockup-only wrapper (not a real component, never registered): SSR renders
// `usePathname()` off the real router context (this dev route's own 3-segment path), so the
// server-rendered CategoryPillRow is null. If the PathnameContext override applied immediately
// on the client too, the client's first paint would show pills while the server HTML shows none,
// a hydration mismatch (measured in this repair round, React's own hydration warning). Mounting
// the override only after `useEffect` fires makes the client's FIRST paint match the server
// (null, same as SSR), then swap to the overridden pathname once hydration has already settled,
// which is the standard client-only-render pattern for a value that only exists in the browser.
function DiscoverPillRow({ locale }: { locale: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <PathnameContext.Provider value={`/${locale}/inspo`}>
      <CategoryPillRow />
    </PathnameContext.Provider>
  );
}

function Feed({ items }: { items: DiscoveryItem[] }) {
  if (items.length === 0) {
    return <div className="py-10 text-center text-[13px] text-s-ink-2">Loading the real feed…</div>;
  }
  return (
    <div className="-mx-4 px-1.5">
      <MasonryGrid
        items={items}
        renderItem={(item) =>
          item.media_type === "tiktok" ? (
            <VideoCard item={item} isAuthenticated={false} canSave={!item.id.startsWith("proof-")} />
          ) : (
            <ItemCard item={item} isAuthenticated={false} canSave={!item.id.startsWith("proof-")} />
          )
        }
      />
    </div>
  );
}

export default function InspoAnchorMockup() {
  const locale = useLocale();
  const t = useTranslations("discover");
  const items = useRealFeed();

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <p className="mb-8 text-[13px] font-semibold text-s-ink">Current, the real page body today (this dev route carries no header at all by design, see the note at the top of this file; the real route shows &quot;Inspo&quot; in the header instead of a body heading)</p>
        <div className="mb-3 -mx-4">
          <div className="px-4">
            <HomeSearchPill locale={locale} label={t("searchPlaceholder")} trailing="saved" />
          </div>
          {/* DiscoverPillRow, defined above: PathnameContext override, applied only after
              mount to avoid a hydration mismatch (see that function's comment). Makes the real,
              unmodified CategoryPillRow believe it is mounted on /en/inspo, the only path it
              renders on, instead of this dev route's own 3-segment path. */}
          <DiscoverPillRow locale={locale} />
        </div>
        <Feed items={items} />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-14 border-t border-s-border mt-14">
        <p className="mb-8 text-[13px] font-semibold text-s-ink">Proposed, a body-level heading added above the search field</p>
        <h1 className="mb-4 font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">Inspo</h1>
        <div className="mb-3 -mx-4">
          <div className="px-4">
            <HomeSearchPill locale={locale} label={t("searchPlaceholder")} trailing="saved" />
          </div>
          <DiscoverPillRow locale={locale} />
        </div>
        <Feed items={items} />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-4">
        <p className="text-[13px] text-s-ink-2">
          Measured font sizes rendered by this file: Current block: 13px (label). Proposed block:
          13px (label), 28px (heading). Heading class is font-display (Inter Tight) font-semibold,
          the same class combination as the locked precedent at
          app/[locale]/salon/[slug]/team/page.tsx:89, but the LIVE computed weight measured on
          this page is 500, not 600: globals.css&apos;s dated 2026-08-15 rule (&quot;TWO TEXT
          WEIGHTS ON CUSTOMER SURFACES&quot;, owner-picked option C) demotes every
          font-semibold/font-bold on a customer surface to 500 site-wide, so the brief&apos;s
          literal &quot;Inter Tight 600&quot; is not achievable without fighting a locked, dated
          rule, and this file does not fight it. No subline added: discover.subtitle
          (&quot;Your next look&quot;) exists in messages/en.json but has zero render sites
          anywhere in the app (checked: no file references discover.subtitle or
          tDiscover(&quot;subtitle&quot;)), so it does not meet the brief&apos;s &quot;only if the
          page already has one&quot; condition.
        </p>
      </div>
    </main>
  );
}
