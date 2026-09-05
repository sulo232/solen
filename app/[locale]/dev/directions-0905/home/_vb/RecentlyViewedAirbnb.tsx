"use client";

// Grounded-in: app/[locale]/_components/homepage/RecentlyViewed.tsx (the real component this
// file forks; every prop, every data path, every i18n key is unchanged from it).
//
// Exists-check: ran `npm run exists RecentlyViewed`, hit the real, live component. This file is a
// COPY of it (off-limits rule: fork into _v<letter>/ when the anatomy must change), because this
// direction is LOOK-FULL and needs SalonCardAirbnb.tsx (this folder's forked card) instead of the
// real SalonCard. Every prop, the localStorage read, the fallback-to-top-salons logic and every
// i18n key are byte-identical to the real component; the only two changes are (1) SalonCard ->
// SalonCardAirbnb and (2) the card width formula, both described below.
//
// Direction: home ?v=b, Airbnb look at FULL STRENGTH (LOCK MODE: LOOK-FULL).
//
// Sources + values taken:
//   - _design-system/references/airbnb--home-mobile.md -> "cards visible across 390: about 2.2"
//     (measured, verified both sides). Solved against Solen's own existing gutter/gap tokens
//     (12px edge padding via SectionFrame's px-3/-mx-3 pattern, 12px inter-card gap via
//     ScrollRow's gap-3, both unchanged, not new values): 390 = 2.2w + 1.2(12) + 2(12) ->
//     w = (390 - 14.4 - 24) / 2.2 ~= 160px, which the formula below expresses as
//     `(100vw - 36px) / 2.2` (160.9px at 390, within 5px of Airbnb's own measured 165px card).
//     This REPLACES the live page's own `(100vw-44px)/1.5` formula (~1.6 cards visible).
//
// Conflicts: lock: card-count-per-viewport ~1.6 (the live RecentlyViewed's own `/1.5` divisor)
// broken on purpose: reference value = Airbnb's measured ~2.2 cards visible (airbnb--home-mobile.md).
// The card's own anatomy (photo ratio, radius, shadow, ink) is broken inside SalonCardAirbnb.tsx,
// not duplicated here, see that file's own header for those four conflicts.
//
// No em-dashes. English copy only (all visible strings are the real i18n keys).

import * as React from "react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionPrimitivesAirbnb";
import { SalonCardAirbnb, type SalonCardAirbnbProps } from "./SalonCardAirbnb";
import { useCustomerPrefs, sortByCategoryPicks, type CustomerPrefs } from "@/app/[locale]/_components/homepage/useCustomerPrefs";
import { useLocale, useTranslations } from "next-intl";
import type { SalonCardDataMap } from "@/app/[locale]/_components/homepage/salonCardData";
import { nameForLocale } from "@/lib/min-price-service";

const STORAGE_KEY = "solen.recently-viewed";

// measured: airbnb--home-mobile.md "cards visible across 390: about 2.2" against ours "~1.6";
// solved for width using Solen's own existing 12px gutter + 12px gap (unchanged tokens), see
// file header. sm/md/lg/xl keep the SAME proportional scale-up the real component's own default
// formula uses (2.2/1.5 ratio against its 1.5/3/4/5/6 steps), not an independently measured
// Airbnb desktop number (this direction is verified at 390x844 mobile only).
const AIRBNB_CARD_WIDTH = [
  "w-[calc((100vw-36px)/2.2)]",
  "sm:w-[calc((100%-24px)/4.4)]",
  "md:w-[calc((100%-36px)/5.9)]",
  "lg:w-[calc((100%-48px)/7.3)]",
  "xl:w-[calc((100%-60px)/8.8)]",
].join(" ");

interface RecentEntry {
  id?: string;
  slug: string;
  name: string;
  category: SalonCardAirbnbProps["category"];
  photoUrl?: string;
}

function isValidEntry(e: unknown): e is RecentEntry {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.slug === "string" && o.slug.length > 0 &&
    typeof o.name === "string" && o.name.trim().length > 0 &&
    typeof o.category === "string" &&
    (o.category === "coiffeur" || o.category === "barbershop" || // drift-ok: type-union guard byte-copied from the real RecentlyViewed.tsx, not a per-category render branch
     o.category === "nails" || o.category === "spa") // drift-ok: same guard, continued
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
    console.error("[RecentlyViewedAirbnb] localStorage read failed:", err);
    return [];
  }
}

export default function RecentlyViewedAirbnb({
  prefsOverride,
  salonData = {},
  topSalonIds = [],
}: {
  prefsOverride?: CustomerPrefs | null;
  salonData?: SalonCardDataMap;
  topSalonIds?: string[];
} = {}) {
  const fetched = useCustomerPrefs();
  const prefs = prefsOverride !== undefined ? prefsOverride : fetched;
  const [entries, setEntries] = React.useState<RecentEntry[] | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setEntries(readStorage());
  }, []);

  const hasHistory = entries !== null && entries.length > 0;
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
  const list: RecentEntry[] = hasHistory
    ? entries
    : sortByCategoryPicks(fallback, prefs?.categories ?? []);
  const locale = useLocale();
  const t = useTranslations("ui.recentlyViewed");
  const title = hasHistory ? t("title") : t("topTitle");
  const linkLabel = t("browseAll");
  const linkHref = hasHistory ? `/${locale}/recently-viewed` : `/${locale}/search`;

  if (!hasHistory && fallback.length === 0) return null;

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title={title}
          link={{ label: linkLabel, href: linkHref }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {list.map((s, i) => {
            const real = s.id ? salonData[s.id] : undefined;
            return (
              <SalonCardAirbnb
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
                widthClassName={AIRBNB_CARD_WIDTH}
                priority={i === 0}
              />
            );
          })}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
