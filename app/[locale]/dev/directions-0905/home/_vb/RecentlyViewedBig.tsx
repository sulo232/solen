"use client";

// Grounded-in: app/[locale]/_components/homepage/RecentlyViewed.tsx (the real component this
// file forks; every prop, every data path, every i18n key is unchanged from it).
//
// Exists-check: ran `npm run exists RecentlyViewed`, hit the real, live component. This file is a
// COPY of it (per the off-limits rule: "copy that component into your own _v<letter>/ folder,
// rename it, change the copy"), because the real file lives under the off-limits
// app/[locale]/_components tree. The only functional change from the original: each SalonCard
// call gets `widthClassName` (SalonCard's own sanctioned width-override prop, added 2026-07-24
// for exactly this "bigger card, same anatomy" case) so the rail reads as Airbnb's "fewer, bigger"
// rail per this direction's brief. SalonCard's own file, its 5:4 photo ratio, its text stack and
// its radius are never touched, only the width class passed into it. The section chrome
// (Section/SectionFrame/SectionTitle/ScrollRow) comes from ./SectionPrimitivesBig, this folder's
// own copy of the real SectionHeader.tsx primitives (see that file's header for why it is a local
// copy rather than a direct import).
//
// Depicts: recently-viewed rail, bigger cards -> real file app/[locale]/_components/homepage
// RecentlyViewed.tsx, forked here with one new constant (BIG_CARD_WIDTH); everything else,
// including the i18n keys and the localStorage read, is byte-identical to the real component.
//
// No em-dashes. English copy only (all visible strings are the real i18n keys).

import * as React from "react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionPrimitivesBig";
import { SalonCard, type SalonCardProps } from "@/app/[locale]/_components/homepage/SalonCard";
import { useCustomerPrefs, sortByCategoryPicks, type CustomerPrefs } from "@/app/[locale]/_components/homepage/useCustomerPrefs";
import { useLocale, useTranslations } from "next-intl";
import type { SalonCardDataMap } from "@/app/[locale]/_components/homepage/salonCardData";
import { nameForLocale } from "@/lib/min-price-service";

const STORAGE_KEY = "solen.recently-viewed";

// Airbnb rails direction: fewer, bigger cards. Solen's own default mobile card formula is
// (100vw-44px)/1.5 (~231px at 390 wide). This widens it so ~1.3 cards sit in the viewport instead
// of ~1.6, taller too since SalonCard's own aspect-[5/4] photo ratio is untouched (anatomy locked).
// measured: 390px viewport -> (390-32)/1.3 = 275px card (vs the live page's 231px).
const BIG_CARD_WIDTH = [
  "w-[calc((100vw-32px)/1.3)]",
  "sm:w-[calc((100%-24px)/2.4)]",
  "md:w-[calc((100%-36px)/3)]",
  "lg:w-[calc((100%-48px)/3.6)]",
  "xl:w-[calc((100%-60px)/4.2)]",
].join(" ");

interface RecentEntry {
  id?: string;
  slug: string;
  name: string;
  category: SalonCardProps["category"];
  photoUrl?: string;
}

// This validates a stored value against the same 4-member category type union the real
// RecentlyViewed.tsx checks, byte-copied from it: a type-union guard, not an if-category-render
// branch.
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
    console.error("[RecentlyViewedBig] localStorage read failed:", err);
    return [];
  }
}

export default function RecentlyViewedBig({
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
                widthClassName={BIG_CARD_WIDTH}
                priority={i === 0}
              />
            );
          })}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
