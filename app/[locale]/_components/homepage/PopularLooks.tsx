"use client";

// mockup-ok: this component is built against the owner-approved mockup
// public/_mockups/home-v3/search-a.html (serviceTileRow(), .sa-tilerail/.sa-tilebox/.sa-tilename/
// .sa-tilemeta), not a live/from-memory redesign , see the file header below.
//
// exists-check (I5, 2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html):
// ran `npm run exists PopularLooks` (only this turn's own new usePopularLooks.ts hook, no component)
// and `npm run exists homepage` (33 existing homepage components, none matching; Entdecken.tsx is
// the closest neighbour , same /api/discovery/feed?category=hair source, this task's own "do NOT
// touch the Inspiration section" constraint means it stays a separate component reusing the same
// data, not an edit to that file). Owner rejected service ICONS here twice (search-a.html's own
// comment: "ONE DELIBERATE DIFFERENCE FROM THE REFERENCE: Airbnb's tiles are photographic... the
// tile uses the category's own 3D icon... until services have real photos of their own" was the
// FIRST direction, superseded , the task brief for this dispatch is explicit: real seeded discovery
// photographs with real titles and real starting prices, NOT service icons).
//
// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md (Layout / Section composition)
// and _design-system/components/PopularLooks.md written in this same turn.

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";
import { Skeleton } from "../primitives/Skeleton";
import { usePopularLooks } from "./usePopularLooks";

/**
 * Popular looks , 4-across photo tile row (I5, search-a.html serviceTileRow()). Real seeded
 * discovery items (usePopularLooks.ts -> /api/discovery/feed?category=hair, the SAME source
 * Entdecken.tsx already pulls from), each with a real photo, a real title, and a real starting
 * price. A look with no resolvable price is dropped by the hook itself, never shown with an
 * invented or omitted price. Self-hides below 2 real tiles (a lonely tile is not a row), same
 * floor AvailableThisWeek.tsx / TopCategoryRails.tsx / CategoryBrowseRails.tsx's Rail() all use.
 */
export default function PopularLooks() {
  // 2026-08-15: this label was a hardcoded German literal, so it rendered German on /en,
  // /fr and /it. Same bug class the owner caught on the recently-viewed row that day.
  const t = useTranslations("home.trending");
  const tDiscover = useTranslations("home.discover");
  const locale = useLocale();
  const { looks, loading } = usePopularLooks({ limit: 8 });

  if (!loading && looks.length < 2) return null;

  return (
    <Section>
      <SectionFrame>
        {/* "Alle entdecken →" is Entdecken.tsx's own existing link copy for the same /inspo
            destination, reused verbatim rather than inventing new German. */}
        <SectionTitle
          title={t("popularLooks")}
          link={{ label: `${tDiscover("browseAll")} →`, href: `/${locale}/inspo` }}
        />
        <div className="mt-2.5 grid grid-cols-4 gap-x-2.5 gap-y-4">
          {loading && looks.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-0">
                  <Skeleton aspect="square" rounded={16} />
                  <Skeleton height={12} width="80%" rounded={4} className="mt-2" />
                  <Skeleton height={12} width="40%" rounded={4} className="mt-1" />
                </div>
              ))
            : looks.map((look) => (
                <Link key={look.id} href={`/${locale}/inspo/${look.id}`} className="block min-w-0">
                  <div className="aspect-square w-full overflow-hidden rounded-[16px] bg-s-bg-sunken">
                    <img
                      src={look.image}
                      alt=""
                      loading="lazy"
                      className="block h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 font-body text-[12px] font-medium leading-[1.3] text-s-ink">
                    {look.title}
                  </p>
                  <p className="mt-0.5 font-body text-[12px] leading-[1.3] text-s-ink-2">
                    ab CHF {look.priceFromCHF}
                  </p>
                </Link>
              ))}
        </div>
      </SectionFrame>
    </Section>
  );
}
