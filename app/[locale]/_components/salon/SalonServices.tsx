"use client";

import * as React from "react";
import Link from "next/link";
import type { Service, SalonDetail } from "./_shared";
import { capitalize } from "./_shared";
import { TabPill } from "../primitives/TabPill";
import { PriceFrom, SeeAllButton } from "../primitives";
import { cn } from "@/lib/utils";
import { groupServicesByDurationTier } from "@/lib/service-tiers";

/**
 * Duration label. Owner spec (2026-06-09): ALWAYS minutes, lowercase "min",
 * no trailing period. "45 min" / "60 min" / "90 min" (not "1 Std." or "Min.").
 * No Clock icon, text-only second row.
 */
function formatDurationDE(mins: number): string {
  return `${mins} min`;
}

/**
 * SalonServices — V2-D53.3 (2026-05-11).
 *
 * Filter pills (categories derived from `service.category` enum) + service
 * rows with name + duration + price + Book button.
 *
 * Layout split:
 *   • Mobile: divider list, no outer card border, denser padding
 *   • Desktop: each service in its own bordered rounded card with hover lift
 *
 * Brand: per "use Solen brand" instruction —
 *   • Active filter chip: emerald `bg-s-ink text-s-ink`
 *   • Book button: emerald filled
 *   • Price color: dark `text-s-ink` (NOT colored — the price itself shouldn't compete with the CTA)
 *
 * "Alle ansehen" reveals services beyond the first 5 in-place. Once expanded
 * the button hides — re-collapse on category switch.
 */
export function SalonServices({
  services,
  locale,
  slug,
  salon,
}: {
  services: Service[];
  locale: string;
  slug: string;
  /** V2-D53.3: full salon object passed so the "Alle ansehen" sheet
   *  can render the sticky cart sidebar with salon info + thumbnail. */
  salon: SalonDetail;
}) {
  // V2-D53.3: group by subcategory (Schnitt/Farbe/Styling/...) when available,
  // falling back to top-level category for older seed data.
  const grouped = React.useMemo(() => {
    return services.reduce<Record<string, Service[]>>((acc, s) => {
      const key = (s.subcategory ?? s.category ?? "andere");
      (acc[key] ??= []).push(s);
      return acc;
    }, {});
  }, [services]);

  // V2-D53.3 fix #6: always include synthetic "alle" tab so the filter
  // pill row is never empty — Fresha shows chips even with one category.
  // The "alle" tab returns all services; per-category tabs filter.
  const realCategories = Object.keys(grouped);
  const categories = realCategories.length > 0 ? ["alle", ...realCategories] : [];
  const [activeCat, setActiveCat] = React.useState<string>("alle");

  // Compute the "alle" group lazily so any category change flows through one map.
  const fullList = React.useMemo(() => Object.values(grouped).flat(), [grouped]);

  if (services.length === 0) {
    return (
      <section id="section-services">
        <SectionHeader>Services</SectionHeader>
        <p className="font-body mt-4 text-[14px] italic text-s-ink-3">
          Dieser Salon hat noch keine Services hinterlegt.
        </p>
      </section>
    );
  }

  const visible = activeCat === "alle" ? fullList : (grouped[activeCat] ?? []);
  // Always show only first 5 inline — full list lives in the sheet (V2-D53.3 polish).
  const shown = visible.slice(0, 5);

  // Owner mockup service-grouping (2026-06-10): the inline list groups by DURATION tier
  // (Express / Klassisch / Signature) under the existing subcategory filter pills.
  // Pure derivation from duration_minutes — no schema change, no invented data.
  // Shared with Walk-in mode (SalonWalkInPanel.tsx) via lib/service-tiers.ts (rule 12: share, not duplicate).
  const { tiered, untiered } = groupServicesByDurationTier(shown);

  return (
    <section id="section-services">
      <SectionHeader>Services</SectionHeader>

      {/* Filter pills — always render when there's any service. Synthetic
          "Alle" appears first; real categories follow. (V2-D53.3 fix #6) */}
      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* V3-D202 (A6): inline filter chips → <TabPill> primitive. */}
          {categories.map((c) => (
            <TabPill
              key={c}
              active={activeCat === c}
              onClick={() => setActiveCat(c)}
              size="sm"
            >
              {c === "alle" ? "Alle" : capitalize(c)}
            </TabPill>
          ))}
        </div>
      )}

      {/* Grouped cards per the Atelier-Nord service-grouping mockup (owner, 2026-06-11):
          ONE rounded-24 card per tier with whisper shadow (exact mockup values), rows
          inside divided by hairlines — not separate cards per service. */}
      <div className="mt-5 space-y-6">
        {tiered.map(({ tier, rows }) => (
          <div key={tier.key}>
            <div className="flex items-baseline gap-2">
              <h3 className="font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">{tier.label}</h3>
              <span className="text-[13px] tabular-nums text-s-ink-3">{tier.range}</span>
            </div>
            <ul className="mt-3 overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
              {rows.map((s) => (
                <ServiceRow key={s.id} service={s} locale={locale} slug={slug} />
              ))}
            </ul>
          </div>
        ))}
        {untiered.length > 0 && (
          <ul className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
            {untiered.map((s) => (
              <ServiceRow key={s.id} service={s} locale={locale} slug={slug} />
            ))}
          </ul>
        )}
      </div>

      {/* "Alle ansehen" links into the booking flow's service step (the single
          service-selection UI); the standalone sheet was a duplicate, removed 2026-07-19. */}
      {visible.length > 0 && (
        <div className="mt-5 flex justify-center">
          {/* mockup-ok: SeeAllButton port, byte-identical pill class string */}
          <SeeAllButton label="Alle ansehen" href={`/${locale}/salon/${slug}/booking`} />
        </div>
      )}

    </section>
  );
}

function ServiceRow({
  service,
  locale,
  slug,
}: {
  service: Service;
  locale: string;
  slug: string;
}) {
  // V3-D227 (2026-05-27, user-paste Fresha service-row spec):
  //   - 3-row stack: name (16/700) / duration grey (14/400 "30 Min.") / price (15/700 "ab N CHF")
  //   - NO description line in the list view (Fresha doesn't show it — keeps density)
  //   - NO Clock icon next to duration (Fresha is text-only)
  //   - Price format "ab {N} CHF" (German "ab" prefix, currency suffix)
  //   - BOTH mobile AND desktop variants get the same bordered card treatment now
  //     (previously mobile was a bare list with no border — off-spec)
  // V3-D346 (2026-05-28): name 600->500 + price bold->grey-normal per LOCKFILE §2.5
  // card-hierarchy rule A13 — exactly one ink anchor (the service name); duration + price recede.
  // P1 fix (owner-approved 2026-07-15, fixes-refined): SUPERSEDED per CLAUDE.md taste rule 5 /
  // V3-D442 (a card may carry TWO ink elements, name + price, when the name stays visibly
  // larger): price goes back to bold ink, matching SalonBundles/SalonProducts on this page,
  // duration alone recedes to grey.
  const inner = (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="font-body text-[15px] font-semibold text-s-ink md:text-[16px]">
          {service.name_de}
        </div>
        <div className="font-body mt-1 text-[13px] text-s-ink-3 md:text-[14px]">
          {formatDurationDE(service.duration_minutes)}
        </div>
        {/* mockup-ok: P1 fix, price is the one bold-ink anchor per row (matches SalonBundles/SalonProducts on this same page, approved fixes-refined) */}
        <div className="font-body mt-3 text-[14px] font-bold text-s-ink md:text-[15px]">
          <PriceFrom amount={service.price} label="ab" />
        </div>
      </div>
      <Link
        href={`/${locale}/salon/${slug}/booking?service=${service.id}`}
        className="font-body shrink-0 rounded-full border border-s-border bg-white px-5 py-2 text-[13px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken md:px-6 md:py-2.5 md:text-[14px]"
      >
        Buchen
      </Link>
    </div>
  );

  // Row inside the grouped card (Atelier mockup .srow): 18x20 padding, hairline
  // divider between rows (border-top, first row none). The card owns the chrome.
  // geometry sweep (2026-07-17, _geometry-triage.md #5): py-[18px] -> py-4 (16),
  // the tighter neighbor per the row-list convention (SalonBundles.tsx:148 py-3,
  // SalonProducts.tsx:105 py-3.5) is closer to 16 than 20. The identical
  // py-[18px] literal also appears in 7 other files (SalonServicesSheet.tsx:264,
  // TextInput.tsx:39 FENCED, SalonWalkInPanel.tsx:166+195, ServicesStaffStep.tsx:459,
  // StaffProfilePage.tsx:345), left untouched, out of this file's scope.
  return (
    <li className="border-t border-s-border px-5 py-4 first:border-t-0 md:px-6">
      {inner}
    </li>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    // V3-D202 (A6): font-body → font-display Inter Tight + Scale B clamp + tracking lock.
    <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
      {children}
    </h2>
  );
}
