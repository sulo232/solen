"use client";

import * as React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Service, SalonDetail } from "./_shared";
import { capitalize } from "./_shared";
import { SalonServicesSheet } from "./SalonServicesSheet";
import { cn } from "@/lib/utils";

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
 *   • Active filter chip: emerald `bg-s-brand text-white`
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

  return (
    <section id="section-services">
      <SectionHeader>Services</SectionHeader>

      {/* Filter pills — always render when there's any service. Synthetic
          "Alle" appears first; real categories follow. (V2-D53.3 fix #6) */}
      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCat(c)}
              className={cn(
                "font-body shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors md:text-[14px]",
                activeCat === c
                  ? "border-s-brand bg-s-brand text-white"
                  : "border-s-border bg-white text-s-ink-2 hover:border-s-brand hover:text-s-brand"
              )}
            >
              {c === "alle" ? "Alle" : capitalize(c)}
            </button>
          ))}
        </div>
      )}

      {/* MOBILE — divider list */}
      <ul className="mt-5 divide-y divide-s-border md:hidden">
        {shown.map((s) => (
          <ServiceRow key={s.id} service={s} locale={locale} slug={slug} variant="mobile" />
        ))}
      </ul>

      {/* DESKTOP — bordered cards */}
      <ul className="mt-5 hidden space-y-3 md:block">
        {shown.map((s) => (
          <ServiceRow key={s.id} service={s} locale={locale} slug={slug} variant="desktop" />
        ))}
      </ul>

      {/* "Alle ansehen" — V2-D53.3 polish: now opens a full-screen sheet
          matching Fresha's services-selection step instead of expanding
          inline. Shows whenever there are services (even if < 5 visible)
          because the sheet IS the booking flow's step 1. */}
      {visible.length > 0 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="font-body inline-flex items-center rounded-full border border-s-ink bg-white px-8 py-3 text-[14px] font-semibold text-s-ink transition-colors hover:bg-s-ink hover:text-white md:px-10 md:py-3.5 md:text-[15px]"
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
  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="font-body text-[15px] font-semibold text-s-ink md:text-[16px]">
          {service.name_de}
        </div>
        {/* V2-D53.3 fix #7: render service description (Fresha shows brief
            copy under each service name). Two-line clamp keeps row density. */}
        {service.description_de && (
          <p className="font-body mt-1 text-[13px] leading-snug text-s-ink-3 line-clamp-2 md:text-[14px]">
            {service.description_de}
          </p>
        )}
        <div className="font-body mt-1.5 flex items-center gap-2 text-[12px] text-s-ink-3 md:text-[13px]">
          <Clock size={12} strokeWidth={2} />
          {service.duration_minutes} min
        </div>
        <div className="font-body mt-2 text-[14px] font-semibold text-s-ink md:text-[15px]">
          CHF {service.price}
        </div>
      </div>
      <Link
        href={`/${locale}/salon/${slug}/booking?service=${service.id}`}
        className="font-body shrink-0 rounded-full border border-s-ink bg-white px-5 py-2 text-[13px] font-semibold text-s-ink transition-colors hover:bg-s-ink hover:text-white md:px-6 md:py-2.5 md:text-[14px]"
      >
        Buchen
      </Link>
    </div>
  );

  if (variant === "mobile") {
    return <li className="py-4">{inner}</li>;
  }

  return (
    <li className="rounded-2xl border border-s-border bg-white p-6 transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] md:p-7">
      {inner}
    </li>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
      {children}
    </h2>
  );
}
