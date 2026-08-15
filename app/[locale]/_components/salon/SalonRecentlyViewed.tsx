"use client";

// Exists-check: `npm run exists salon` and `npm run exists "recently viewed"` both run 2026-08-15.
// The second returns the /recently-viewed ROUTE, the homepage RecentlyViewed + RecentlyViewedTiles
// SECTIONS, RecentlyViewedClient, and the `useRecentlyViewed` HOOK. None of them is a salon-page
// rail, and the homepage section cannot be reused wholesale because it carries homepage chrome: a
// "Top auf Solen" fallback heading for visitors with no history, which is precisely the behaviour
// that must NOT happen here (see the hide-while-empty note below). NOTHING net-new is built in this
// file: it composes that existing hook and the existing SalonCard. The graveyard carries no entry
// for a PDP recently-viewed rail. Registry row + _design-system/components/SalonRecentlyViewed.md
// written in the same turn.
//
// mockup-ok: NO NEW APPEARANCE IS INTRODUCED HERE, which is why this ships without a mockup round.
// Every visual value below is copied from a component that already shipped: the heading class
// string is byte-identical to SalonVenuesNearby's own h2, and the carousel geometry (card width
// (100vw - 44px) / 1.25, gap-3, the peeking next card) is that component's too, deliberately, so
// the two rails that now sit next to each other are one object rather than two. The card is the
// real SalonCard. What is new is WHICH SALONS the rail lists, and that is data, not design.

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { SalonCard } from "../homepage/SalonCard";
import { useRecentlyViewed } from "../homepage/useRecentlyViewed";
import { safeCategory } from "./_shared";

/**
 * SalonRecentlyViewed, the salon page's "Zuletzt angesehen" rail.
 *
 * WHY IT EXISTS. Owner 2026-08-15: "instead of having, like, in [Ihrer Nähe], what about if we
 * have, like, specific to their searches and something similar or something similar to the store
 * instead." That is two things in one sentence, so it is two rails:
 *   this file          -> "specific to their searches", the salons this visitor actually opened
 *   SalonVenuesNearby  -> "something similar to the store", renamed from "In der Nähe" to
 *                         "Ähnliche Stores" the same day, because what it always did was pull
 *                         other salons in THIS salon's category. The old name described a
 *                         geography it never actually filtered on.
 *
 * THE COST OF THE HISTORY HALF, named to him before it was built and handled here rather than
 * hidden: recently-viewed is EMPTY for a first-time visitor, and pre-launch that is nearly
 * everyone. `useRecentlyViewed` reads localStorage, so somebody arriving from search or a shared
 * link has seen exactly one salon, the one they are on, and this rail excludes it. The 2026-07-06
 * taste decision says a data-driven surface with nothing to show HIDES rather than renders empty,
 * so this returns null in that case. That is why it ships ALONGSIDE the similar-stores rail rather
 * than instead of it: the similar rail is computed from the salon and always has rows, so the page
 * never loses its discovery block on a first visit.
 *
 * The heading is `recentlyViewed.title`, which already ships in all four locales, so no new copy
 * was written for this. Full note: _design-system/components/SalonRecentlyViewed.md
 */
/** The live row shape `/api/salons/by-slugs` returns, same as RecentlyViewedClient reads. */
type RichSalon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number | null;
  review_count: number | null;
  cover_photo_url: string | null;
  address: string | null;
  categories: string[] | null;
};

export function SalonRecentlyViewed({ excludeSlug }: { excludeSlug: string }) {
  const t = useTranslations("recentlyViewed");
  const locale = useLocale();
  // One more than the rail shows, so excluding the current salon cannot leave it short.
  const { items } = useRecentlyViewed(7);
  const [rich, setRich] = React.useState<RichSalon[] | null>(null);

  const slugs = React.useMemo(
    () => items.filter((s) => s.slug !== excludeSlug).slice(0, 6).map((s) => s.slug),
    [items, excludeSlug],
  );
  const slugKey = slugs.join(",");

  // localStorage holds only slug/name/photo, so the rating and address would be missing and the
  // card would render a bare em-dash where its rating goes. `/api/salons/by-slugs` is the route
  // written for exactly this (its own docstring names recently-viewed as the consumer), and
  // RecentlyViewedClient already reads it the same way. Real numbers or no card.
  React.useEffect(() => {
    if (!slugKey) { setRich([]); return; }
    let alive = true;
    fetch(`/api/salons/by-slugs?slugs=${encodeURIComponent(slugKey)}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => { if (alive) setRich((j.items ?? []) as RichSalon[]); })
      .catch((e) => {
        console.error("[SalonRecentlyViewed] by-slugs fetch failed:", e);
        if (alive) setRich([]);
      });
    return () => { alive = false; };
  }, [slugKey]);

  const others = (rich ?? []).filter((s) => s.slug !== excludeSlug);

  // Hide rather than render an empty rail (taste decision 2026-07-06). This also covers the
  // pre-fetch tick, so the section never flashes an empty heading before its cards arrive.
  if (others.length === 0) return null;

  return (
    <section>
      {/* mockup-ok: byte-identical to SalonVenuesNearby's own h2 class string. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("title")}
      </h2>

      {/* mockup-ok: same carousel geometry as the Ähnliche Stores rail directly below it, copied
          from that component so the two read as one pair rather than two inventions: card width
          (100vw - 44px) / 1.25 with a 12px gap, a quarter of the next card peeking. */}
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {others.map((s) => (
          // Prop-for-prop the same call SalonVenuesNearby makes, including its own
          // widthClassName, so the two rails cannot drift apart.
          <SalonCard
            key={s.id}
            slug={s.slug}
            salonId={s.id}
            name={s.name}
            rating={s.average_rating}
            reviewCount={s.review_count}
            category={safeCategory(s.categories ?? [])}
            photoUrl={s.cover_photo_url ?? undefined}
            variant="availability"
            citySelected
            address={s.address ?? undefined}
            widthClassName="w-[calc((100vw-44px)/1.25)] md:w-[300px]"
          />
        ))}
      </div>
    </section>
  );
}
