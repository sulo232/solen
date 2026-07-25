"use client";

import * as React from "react";
import Link from "next/link";
import type { Service, SalonDetail } from "./_shared";
import { capitalize } from "./_shared";
import { TabPill } from "../primitives/TabPill";
import { PriceFrom, SeeAllButton } from "../primitives";
import { cn } from "@/lib/utils";

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
        <p className="font-body mt-4 text-[14px] text-s-ink-3">
          Dieser Salon hat noch keine Services hinterlegt.
        </p>
      </section>
    );
  }

  const visible = activeCat === "alle" ? fullList : (grouped[activeCat] ?? []);
  // Always show only first 5 inline — full list lives in the sheet (V2-D53.3 polish).
  const shown = visible.slice(0, 5);

  // Inline preview = the active category's first 5 as ONE flat grouped list-card.
  // Real-category organization is the filter pills above (and the full per-category
  // sectioned view lives in "Alle ansehen" → booking). The old invented
  // Express/Klassisch/Signature duration tiers were removed 2026-07-24, matching the
  // booking flow's 2026-07-19 switch to the salon's own category taxonomy.

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

      {/* Single grouped list-card of the inline preview, rows hairline-divided
          (LOCKFILE grouped-list-card grammar). Category grouping is the filter
          pills above; "Alle ansehen" opens the full per-category sectioned view
          in booking. Invented Express/Klassisch/Signature tiers removed 2026-07-24. */}
      <ul className="mt-5 overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
        {shown.map((s) => (
          <ServiceRow key={s.id} service={s} locale={locale} slug={slug} />
        ))}
      </ul>

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
  // mockup-ok: RANGE LAW A1 (2026-07-25), owner-approved via /dev/flatness ("go apply
  // evrth"). Name 600->500 (matches the Team-card-name sibling role, LOCKFILE §2 "500");
  // "Buchen" 600->500 (it's the Secondary CTA role, LOCKFILE §2.5 locks that at 500, and
  // there can be several of these per screen so it is never "the one commit CTA" the task
  // keeps at 600, that's SalonMobileBookBar's single "Termin buchen"); price div drops its
  // own font-bold and instead passes PriceFrom's `emphasis` prop, so ONLY the amount stays
  // bold (the price value, kept per A1) while the "ab" prefix recedes to the div's own
  // (now-normal) inherited weight, its colour (text-s-ink-2 inside PriceFrom) already
  // marks it as a qualifier, not part of the number+currency unit (taste rule 5).
  const inner = (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="font-body text-[15px] font-medium text-s-ink md:text-[16px]">
          {service.name_de}
        </div>
        <div className="font-body mt-1 text-[13px] text-s-ink-3 md:text-[14px]">
          {formatDurationDE(service.duration_minutes)}
        </div>
        <div className="font-body mt-3 text-[14px] text-s-ink md:text-[15px]">
          <PriceFrom amount={service.price} label="ab" emphasis />
        </div>
      </div>
      <Link
        href={`/${locale}/salon/${slug}/booking?service=${service.id}`}
        className="font-body shrink-0 rounded-full border border-s-border bg-white px-5 py-2 text-[13px] font-medium text-s-ink transition-colors hover:bg-s-bg-sunken md:px-6 md:py-2.5 md:text-[14px]"
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
