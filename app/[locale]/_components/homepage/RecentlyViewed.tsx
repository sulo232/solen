"use client";

import * as React from "react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";
import { useCustomerPrefs, sortByCategoryPicks, type CustomerPrefs } from "./useCustomerPrefs";
import { useLocale, useTranslations } from "next-intl";
// 2026-07-13: real rating/address/price data batch-fetched server-side in
// page.tsx (type-only import, the Supabase fetch code never reaches this
// client bundle). Same pattern as Nearby.tsx.
import type { SalonCardDataMap } from "./salonCardData";
import { nameForLocale, type ServiceNameLocale } from "@/lib/min-price-service";

/**
 * Recently Viewed - V3 (LIVE_TRUTH §Q51.0 + V2-D34 cards).
 *
 * Conditional section - only renders for returning users with >= 1 entry in
 * localStorage. localStorage key: `solen.recently-viewed`. Capped at last 5.
 * The write happens at `/salon/[slug]` page mount.
 *
 * Each entry is the minimal SalonCard data needed to render (slug, name,
 * category, photoUrl); rating/review count/price/postal code/city are looked
 * up live from `salonData` (batch-fetched server-side in page.tsx) when the
 * entry's id matches.
 *
 * No history yet (first-time visitors) falls back to "Top auf Solen": real
 * top-rated salons (`topSalonIds` prop, getTopSalonIds() in
 * salonCardData.ts), mapped through the same salonData map. An id with no
 * matching (or incomplete) salonData entry is skipped, never shown with an
 * invented name/photo. Section hides entirely when there's no history AND
 * the fallback fetch also came back empty.
 *
 * NOT in this commit:
 *   - "Im Profil ansehen" link target `/profile/recently-viewed` doesn't exist
 *     yet (Phase 3) - link is rendered but routes 404 for now
 */

const STORAGE_KEY = "solen.recently-viewed";

interface RecentEntry {
  /** Real salon UUID, threaded to SalonCard -> HeartButton so the save persists.
   *  Optional: older localStorage entries predate this field (heart stays local). */
  id?: string;
  slug: string;
  name: string;
  category: SalonCardProps["category"];
  photoUrl?: string;
}

// V2-D67-fu13 (2026-05-16): added schema-shape filter. Older versions of the
// app wrote `solen.recently-viewed` entries with different fields (e.g. no
// `name` or no `slug`), which crashed SalonCard's `name.trim()` and produced
// duplicate React keys. Drop any entry missing required fields so the section
// degrades gracefully instead of taking down the page.
function isValidEntry(e: unknown): e is RecentEntry {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.slug === "string" && o.slug.length > 0 &&
    typeof o.name === "string" && o.name.trim().length > 0 &&
    typeof o.category === "string" &&
    (o.category === "coiffeur" || o.category === "barbershop" ||
     o.category === "nails" || o.category === "spa")
  );
}

function readStorage(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry).slice(0, 5);
  } catch (err) {
    console.error("[RecentlyViewed] localStorage read failed:", err);
    return [];
  }
}

export default function RecentlyViewed({
  prefsOverride,
  salonData = {},
  topSalonIds = [],
}: {
  /** Test seam. Bypasses the live fetch when provided (dev previews). */
  prefsOverride?: CustomerPrefs | null;
  /** Real rating/address/price per salon id, batch-fetched server-side in
   *  page.tsx. Real localStorage entries (unknown id at server render time)
   *  find no match here, so their rating/price/address are simply omitted. */
  salonData?: SalonCardDataMap;
  /** Fallback "Top auf Solen" ids for first-time visitors with no view
   *  history yet, real DB top-rated salons (getTopSalonIds in
   *  salonCardData.ts), fetched server-side in page.tsx. */
  topSalonIds?: string[];
} = {}) {
  const fetched = useCustomerPrefs();
  const prefs = prefsOverride !== undefined ? prefsOverride : fetched;
  const [entries, setEntries] = React.useState<RecentEntry[] | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setEntries(readStorage());
  }, []);

  // V3-D106 (2026-05-23): pre-mount renders the FALLBACK so first-time
  // visitors always see something (per user "if not put same as in der
  // nahe but [renamed] cz how will we acc like yk find"). Title flips
  // to "Top auf Solen" with curated top-rated salons.
  // Pre-mount: render fallback (no flash, no hydration mismatch)
  const hasHistory = entries !== null && entries.length > 0;
  // Fallback: real top-rated salons, mapped through salonData. An id with no
  // matching (or incomplete) entry is skipped, never shown with an invented
  // name/photo.
  const fallback: RecentEntry[] = topSalonIds
    .map((id): RecentEntry | null => {
      const real = salonData[id];
      if (!real || !real.name || !real.slug || !real.category) return null;
      return {
        id,
        slug: real.slug,
        name: real.name,
        category: real.category,
        photoUrl: real.photoUrl ?? undefined,
      };
    })
    .filter((e): e is RecentEntry => e !== null);
  // V3-D348: bend the curated "Top auf Solen" fallback toward the user's picks.
  // Real view history stays chronological (it's "recently viewed", not "for you").
  const list: RecentEntry[] = hasHistory
    ? entries
    : sortByCategoryPicks(fallback, prefs?.categories ?? []);
  const locale = useLocale();
  // 2026-08-15: these three were hardcoded GERMAN string literals, so /en, /fr and /it all rendered
  // "Zuletzt angesehen" and "Alle entdecken" on an otherwise translated page. The owner caught it on
  // /en ("why is their English and German"). `ui.recentlyViewed.title` already existed in all four
  // locale files and was simply never called; topTitle and browseAll were added the same day.
  const t = useTranslations("ui.recentlyViewed");
  const title = hasHistory ? t("title") : t("topTitle");
  // With real history -> the dedicated /recently-viewed page (audit #9). The curated fallback has no
  // history page, so it still points at search. Locale-prefixed (audit #17).
  const linkLabel = t("browseAll");
  const linkHref = hasHistory ? `/${locale}/recently-viewed` : `/${locale}/search`;

  // No history AND the fallback fetch also came back empty (e.g. it failed):
  // hide the section rather than render an empty scroll row.
  if (!hasHistory && fallback.length === 0) return null;

  return (
    // V3-D112 (2026-05-23): bg-s-peach REMOVED per user "remove ths color like
    // cream everywhere" — selected the peach RecentlyViewed section. Reverted
    // to default white substrate. Token `s-peach` kept in tailwind for back-
    // compat / future use; only the usage on this section is removed.
    // Prior V3-D107: bg-s-peach was the warm welcome at top of feed.
    <Section>
      <SectionFrame>
        <SectionTitle
          title={title}
          link={{ label: linkLabel, href: linkHref }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {list.map((s) => {
            const real = s.id ? salonData[s.id] : undefined;
            return (
              <SalonCard
                key={s.slug}
                slug={s.slug}
                salonId={s.id}
                name={s.name}
                rating={real?.rating ?? null}
                reviewCount={real?.reviewCount ?? null}
                category={s.category}
                photoUrl={s.photoUrl}
                variant="availability"
                priceFromCHF={real?.priceFromCHF ?? null}
                priceFromService={nameForLocale(real?.priceFromServiceNames, locale)}
                citySelected={false}
                postalCode={real?.postalCode ?? undefined}
                city={real?.city ?? undefined}
              />
            );
          })}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
