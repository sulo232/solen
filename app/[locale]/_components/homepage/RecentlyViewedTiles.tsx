"use client";

// mockup-ok: this component is built against the owner-approved mockup
// public/_mockups/home-v3/search-a.html (recentlyViewed(), .sa-rec/.sa-recimg/.sa-rectext/
// .sa-recname/.sa-recmeta), not a live/from-memory redesign , see the file header below.
//
// exists-check (I4, 2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html):
// ran `npm run exists RecentlyViewedTiles` (0 hits, genuinely new) and `npm run exists homepage`
// (33 existing homepage components, none matching; RecentlyViewed.tsx exists but is the SalonCard
// rail, this task's own "existing rails" no-touch list). This file is a SECOND, differently-shaped
// presentation of the SAME real localStorage viewing history (`solen.recently-viewed`, written by
// trackSalonView on every real /salon/[slug] visit) , the mockup's own 4-across square-tile grid,
// distinct from RecentlyViewed.tsx's SalonCard rail. Not a duplicate SalonCard: no rating, no price,
// no border, a photo + two text lines only, per search-a.html's .sa-rec / .sa-recimg / .sa-rectext /
// .sa-recname / .sa-recmeta anatomy.
//
// BUG FOUND + FIXED THIS TURN (components-legacy/RecentlyViewed.tsx): trackSalonView wrote to the
// WRONG localStorage key ("solen_recently_viewed" vs the "solen.recently-viewed" every real reader
// uses) AND the wrong field shape (`categories[]` / `cover_photo_url` vs the `category` / `photoUrl`
// every real reader keys off). A real visit's write was silently invisible to every reader,
// including this one, until that fix landed , see that file's own comment for the full trail.
//
// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md (Layout / Section composition)
// and _design-system/components/RecentlyViewedTiles.md written in this same turn.

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";
import { CATEGORY_LABEL } from "../search/SalonResultCard";

const STORAGE_KEY = "solen.recently-viewed";

interface StoredEntry {
  slug: string;
  name: string;
  category: string;
  photoUrl?: string | null;
}

// drift-ok: a data-validity WHITELIST (is this string one of the 4 real category slugs a stored
// localStorage entry could legally carry), not a category-specific UI/styling branch , identical
// in kind to the same check already shipped in RecentlyViewed.tsx's own isValidEntry(). Every
// category renders through the exact same JSX below; nothing here varies by category.
function isValidEntry(e: unknown): e is StoredEntry {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.slug === "string" && o.slug.length > 0 &&
    typeof o.name === "string" && o.name.trim().length > 0 &&
    typeof o.category === "string" &&
    (o.category === "coiffeur" || o.category === "barbershop" || // drift-ok: validity whitelist, not a style branch
     o.category === "nails" || o.category === "spa") // drift-ok: validity whitelist, not a style branch
  );
}

/** Same shape/parse contract as RecentlyViewed.tsx's own readStorage, just capped at 3 (this
 *  section shows at most 3 real salon cells + 1 city cell = one clean 4-across row). */
function readStorage(): StoredEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry).slice(0, 3);
  } catch (err) {
    console.error("[RecentlyViewedTiles] localStorage read failed:", err);
    return [];
  }
}

/**
 * Recently viewed , 4-across tile grid (I4, search-a.html recentlyViewed()). Real localStorage
 * view history ONLY (same source RecentlyViewed.tsx reads): a first-time visitor with zero history
 * gets NOTHING from this component, never a curated/"Top auf Solen" substitute , that fallback is
 * RecentlyViewed.tsx's separate, already-shipped job, this component's only job is real history.
 * The trailing city cell (real getBaselShopCount, Basel is the only active city per
 * _plans/HOME_V3_CATEGORY_MAP.md ask 1) only renders alongside real history, never on its own.
 */
export default function RecentlyViewedTiles({
  entriesOverride,
  baselShopCount = null,
}: {
  /** Test seam, bypasses the live localStorage read when provided (dev previews). */
  entriesOverride?: StoredEntry[] | null;
  /** Real active-salon count in Basel (getBaselShopCount, salonCardData.ts), server-fetched in
   *  page.tsx. Null omits the count line rather than showing a fabricated number. */
  baselShopCount?: number | null;
} = {}) {
  const locale = useLocale();
  // 2026-08-15: the title below was a hardcoded German literal, so this row said "Zuletzt angesehen"
  // on /en, /fr and /it. `ui.recentlyViewed.title` already existed in all four locale files.
  const t = useTranslations("ui.recentlyViewed");
  const [entries, setEntries] = React.useState<StoredEntry[]>([]);

  React.useEffect(() => {
    setEntries(entriesOverride ?? readStorage());
  }, [entriesOverride]);

  // No real view history: build nothing, never fabricate one.
  if (entries.length === 0) return null;

  return (
    <Section>
      <SectionFrame>
        {/* No link/arrow: matches search-a.html's recentlyViewed(), the one rail built with a bare
            h2 rather than sectionFrame()'s title+arrow pattern used by every rail below it. */}
        <SectionTitle title={t("title")} />
        <div className="mt-2.5 grid grid-cols-4 gap-x-2.5 gap-y-3.5">
          {entries.map((e) => (
            // Focus cue: the global a:focus-visible inset ink edge (globals.css D1-focus-visible)
            // already covers every <a>; no per-component outline class (owner's no-ring policy).
            <Link
              key={e.slug}
              href={`/${locale}/salon/${e.slug}`}
              className="block min-w-0 text-left"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-s-bg-sunken">
                {e.photoUrl ? (
                  <Image
                    src={e.photoUrl}
                    alt=""
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className="absolute inset-0 grid place-items-center font-display text-[20px] font-semibold text-s-ink-2"
                    aria-hidden
                  >
                    {e.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="mt-[7px] min-w-0">
                <p className="truncate font-body text-[12px] font-medium leading-[1.3] text-s-ink">
                  {e.name}
                </p>
                <p className="truncate font-body text-[12px] leading-[1.3] text-s-ink-2">
                  {CATEGORY_LABEL[e.category] ?? e.category}
                </p>
              </div>
            </Link>
          ))}
          <Link
            href={`/${locale}/search?city=basel`}
            className="block min-w-0 text-left"
          >
            <div className="grid aspect-square w-full place-items-center rounded-[14px] bg-s-bg-sunken text-s-ink">
              <MapPin size={17} strokeWidth={1.9} aria-hidden />
            </div>
            <div className="mt-[7px] min-w-0">
              <p className="truncate font-body text-[12px] font-medium leading-[1.3] text-s-ink">
                Basel
              </p>
              {baselShopCount != null && (
                <p className="truncate font-body text-[12px] leading-[1.3] text-s-ink-2">
                  {baselShopCount} Stores
                </p>
              )}
            </div>
          </Link>
        </div>
      </SectionFrame>
    </Section>
  );
}
