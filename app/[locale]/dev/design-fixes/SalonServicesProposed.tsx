"use client";

// Grounded-in: app/[locale]/_components/salon/SalonServices.tsx
//
// Depicts: services list, filter pills, "Book" row CTA, "See all" -> app/[locale]/_components/salon/SalonServices.tsx
// (the real salon PDP services section, rendered live today at /[locale]/salon/[slug]). Nothing
// here is net-new: this file is a byte-copy of that component with only font-size classes changed
// (see the mapping below), same data, same behaviour.
//
// exists-check: net-new vs app/[locale]/_components/salon/SalonServices.tsx (the file this is a
// treatment-only copy OF, per this session's mockup-first law: a copy of the real component with
// only the proposed change applied, never an edit to the file 29 other things may not touch) and
// components-legacy/salon/ServiceCategoryFilter.tsx (a different, legacy filter UI, not this row
// list). `npm run exists design-fixes` ran this turn at the parent page.tsx.
//
// PAIR D "Proposed" half. Byte-copy of app/[locale]/_components/salon/SalonServices.tsx
// (2026-09-04 design walk) with ONLY font sizes changed, snapped to the locked LOCKFILE
// type scale (name 14, meta 12, body 14, section-H2 clamp(18px,2vw,20px), CTA 15).
// Structure, colors, spacing and behaviour are untouched.
//
// measured: SalonServices.tsx source read at 390px (no md: breakpoint reachable there):
// SectionHeader clamp(18,2vw,20)=18, TabPill sm=13, group h3=16, service title=15, duration
// meta=13, price row=14, Buchen CTA=13, description=14, SeeAllButton=14 -> distinct {13,14,15,16,18}.
// Re-confirmed live with getComputedStyle against /en/dev/design-fixes per the brief (see report).
//
// Role mapping applied (measured live at 390px, no md: breakpoint reachable there so the
// original's md: bumps never rendered anyway and are dropped for a single, unambiguous size):
//   - Section heading ("Services")            clamp(18,2vw,20) -> unchanged (already the H2 role)
//   - Filter pill text (TabPill, sm size)     13px             -> forced 14px (!text-[14px]),
//     TabPill itself is a shared primitive imported by 29 files and out of this copy's scope,
//     so the override is applied at the call site via className, not by editing TabPill.tsx.
//   - Per-category group heading (h3)         16px             -> 14px  (name role)
//   - Service name                            15px/16px        -> 14px  (name role)
//   - Duration meta                           13px/14px        -> 12px  (meta role)
//   - Price row                               14px/15px        -> 14px  (body role, unchanged)
//   - "Book" CTA                              13px/14px        -> 15px  (CTA role, LOCKFILE:
//     "CTA never <=13 on a button")
// ServiceDisclosureRow's own description text (14px) and SeeAllButton's base text (14px) are
// shared primitives rendering unmodified; both already land on the body/CTA role so nothing
// there needed a fix.
//
// COPY DEVIATION (forced, not chosen): the real SalonServices.tsx hardcodes "Alle ansehen" and
// "Buchen" as literal strings, not i18n keys, so this copy is not exempt from the always-English
// mockup rule the way a real i18n-driven component is. Byte-copying those two literals tripped the
// mockup-english-gate. Per the standing rule that copy is English even when it means deviating
// from "change nothing else", those two labels are translated to English below in THIS proposed
// copy only; the Current side renders the real, unmodified SalonServices.tsx as-is (still German
// there, see the return report for why that is left untouched). {service.name_de} still renders
// real German service names as real seeded data on both sides, untouched.

import * as React from "react";
import Link from "next/link";
import type { Service, SalonDetail } from "@/app/[locale]/_components/salon/_shared";
import { capitalize } from "@/app/[locale]/_components/salon/_shared";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { PriceFrom, SeeAllButton, ServiceDisclosureRow } from "@/app/[locale]/_components/primitives";

const SEE_ALL_LABEL = "See all";
const BOOK_LABEL = "Book";

function formatDurationLabel(mins: number): string {
  return `${mins} min`;
}

export function SalonServicesProposed({
  services,
  locale,
  slug,
  salon,
}: {
  services: Service[];
  locale: string;
  slug: string;
  salon: SalonDetail;
}) {
  const grouped = React.useMemo(() => {
    return services.reduce<Record<string, Service[]>>((acc, s) => {
      const key = (s.subcategory ?? s.category ?? "andere");
      (acc[key] ??= []).push(s);
      return acc;
    }, {});
  }, [services]);

  const realCategories = Object.keys(grouped);
  const categories = realCategories.length > 0 ? ["alle", ...realCategories] : [];
  const [activeCat, setActiveCat] = React.useState<string>("alle");

  const fullList = React.useMemo(() => Object.values(grouped).flat(), [grouped]);

  if (services.length === 0) {
    return (
      <section id="section-services-proposed">
        <SectionHeader>Services</SectionHeader>
      </section>
    );
  }

  const visible = activeCat === "alle" ? fullList : (grouped[activeCat] ?? []);
  const shown = visible.slice(0, 6);

  const shownGroups = React.useMemo(() => {
    const out: { key: string; items: Service[] }[] = [];
    for (const s of shown) {
      const key = s.subcategory ?? s.category ?? "andere";
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(s);
      else {
        const existing = out.find((g) => g.key === key);
        if (existing) existing.items.push(s);
        else out.push({ key, items: [s] });
      }
    }
    return out;
  }, [shown]);

  return (
    <section id="section-services-proposed">
      <SectionHeader>Services</SectionHeader>

      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <TabPill
              key={c}
              active={activeCat === c}
              onClick={() => setActiveCat(c)}
              size="sm"
              className="!text-[14px]"
            >
              {c === "alle" ? "Alle" : capitalize(c)}
            </TabPill>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-8">
        {shownGroups.map((g) => (
          <section key={g.key}>
            <h3 className="font-display mb-3 text-[14px] font-semibold capitalize tracking-[-0.01em] text-s-ink">
              {capitalize(g.key)}
            </h3>
            <ul className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
              {g.items.map((s) => (
                <ServiceRow key={s.id} service={s} locale={locale} slug={slug} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {visible.length > 0 && (
        <div className="mt-5 flex justify-center">
          <SeeAllButton label={SEE_ALL_LABEL} href={`/${locale}/salon/${slug}/booking`} />
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
  const inner = (
    <div className="flex items-center justify-between gap-4">
      <ServiceDisclosureRow
        title={
          <div className="font-body text-[14px] font-medium text-s-ink">
            {service.name_de}
          </div>
        }
        meta={
          <div className="font-body mt-1 text-[12px] text-s-ink-2">
            {formatDurationLabel(service.duration_minutes)}
          </div>
        }
        description={service.description_de}
        price={
          <div className="font-body mt-3 text-[14px] text-s-ink">
            <PriceFrom amount={service.price} label="ab" emphasis />
          </div>
        }
      />
      <Link
        href={`/${locale}/salon/${slug}/booking?service=${service.id}`}
        className="font-body shrink-0 rounded-full border border-s-border bg-white px-5 py-2 text-[15px] font-medium text-s-ink transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide"
      >
        {BOOK_LABEL}
      </Link>
    </div>
  );

  return (
    <li className="border-t border-s-border px-5 py-4 first:border-t-0">
      {inner}
    </li>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
      {children}
    </h2>
  );
}
