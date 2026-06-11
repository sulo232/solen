"use client";

import * as React from "react";
import Link from "next/link";
import type { Service, SalonDetail } from "./_shared";
import { capitalize } from "./_shared";
import { SalonServicesSheet } from "./SalonServicesSheet";
import { TabPill } from "../primitives/TabPill";
import { PriceFrom } from "../primitives";
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
  const [sheetOpen, setSheetOpen] = React.useState(false);

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
  const TIERS: { key: string; label: string; range: string; match: (d: number) => boolean }[] = [
    { key: "express", label: "Express", range: "15–30 Min", match: (d) => d > 0 && d <= 30 },
    { key: "klassisch", label: "Klassisch", range: "45–60 Min", match: (d) => d > 30 && d <= 60 },
    { key: "signature", label: "Signature", range: "90+ Min", match: (d) => d > 60 },
  ];
  const tiered = TIERS
    .map((tier) => ({ tier, rows: shown.filter((s) => tier.match(s.duration_minutes ?? 0)) }))
    .filter((g) => g.rows.length > 0);
  // Services with no usable duration fall outside every tier — keep them visible, untiered.
  const untiered = shown.filter((s) => !TIERS.some((tier) => tier.match(s.duration_minutes ?? 0)));

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

      {/* Duration-tier groups (owner mockup): tier header (name + range) above its rows.
          Same bordered ServiceRow cards as before (V3-D227) — only the grouping changed. */}
      <div className="mt-5 space-y-6">
        {tiered.map(({ tier, rows }) => (
          <div key={tier.key}>
            <div className="flex items-baseline gap-2">
              <h3 className="font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">{tier.label}</h3>
              <span className="text-[13px] tabular-nums text-s-ink-3">{tier.range}</span>
            </div>
            <ul className="mt-2.5 space-y-3 md:hidden">
              {rows.map((s) => (
                <ServiceRow key={s.id} service={s} locale={locale} slug={slug} variant="mobile" />
              ))}
            </ul>
            <ul className="mt-2.5 hidden space-y-3 md:block">
              {rows.map((s) => (
                <ServiceRow key={s.id} service={s} locale={locale} slug={slug} variant="desktop" />
              ))}
            </ul>
          </div>
        ))}
        {untiered.length > 0 && (
          <div>
            <ul className="space-y-3 md:hidden">
              {untiered.map((s) => (
                <ServiceRow key={s.id} service={s} locale={locale} slug={slug} variant="mobile" />
              ))}
            </ul>
            <ul className="hidden space-y-3 md:block">
              {untiered.map((s) => (
                <ServiceRow key={s.id} service={s} locale={locale} slug={slug} variant="desktop" />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* "Alle ansehen" — V2-D53.3 polish: now opens a full-screen sheet
          matching Fresha's services-selection step instead of expanding
          inline. Shows whenever there are services (even if < 5 visible)
          because the sheet IS the booking flow's step 1. */}
      {visible.length > 0 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="font-body inline-flex items-center rounded-full bg-s-bg-sunken px-8 py-3 text-[14px] font-semibold text-s-ink transition-colors hover:bg-s-border md:px-10 md:py-3.5 md:text-[15px]"
          >
            Alle ansehen
          </button>
        </div>
      )}

      {/* Full-screen sheet (open on "Alle ansehen" click) */}
      <SalonServicesSheet
        salon={salon}
        locale={locale}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </section>
  );
}

function ServiceRow({
  service,
  locale,
  slug,
  variant,
}: {
  service: Service;
  locale: string;
  slug: string;
  variant: "mobile" | "desktop";
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
  const inner = (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="font-body text-[15px] font-semibold text-s-ink md:text-[16px]">
          {service.name_de}
        </div>
        <div className="font-body mt-1 text-[13px] text-s-ink-3 md:text-[14px]">
          {formatDurationDE(service.duration_minutes)}
        </div>
        <div className="font-body mt-3 text-[14px] font-normal text-s-ink-2 md:text-[15px]">
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

  // V3-D227: unify mobile + desktop into the same card.
  // FLAT per the approved every-state mockup 03 .svc (owner, 2026-06-11): hairline
  // border, NO shadow. Reverts the 2026-06-09 elevation-2/3 "depth fix" — white +
  // shadow on the calm white page is the banned grey-haze (CONTROL_ELEVATION B).
  return (
    <li className={cn(
      "rounded-2xl border border-s-border bg-white transition-colors hover:border-s-ink/30",
      variant === "mobile" ? "p-5" : "p-6 md:p-7",
    )}>
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
