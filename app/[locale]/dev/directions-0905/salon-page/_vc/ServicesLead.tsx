"use client";

// Grounded-in: app/[locale]/_components/salon/SalonServices.tsx (COPIED per the brief's
// own allowance: "If your direction needs a component's anatomy changed, COPY that
// component into your own _v<letter>/ folder, rename it, and change the copy"). Row
// anatomy (name / duration / price / Book), filter pills, category grouping, the locked
// 24px whisper card and the ServiceDisclosureRow tap-to-expand behaviour are all
// byte-identical to the real component. The ONE anatomy change Direction C needs: "Book"
// no longer navigates immediately, it marks the service as the page's running selection
// (a native <button>, not a <Link>), so the sticky bar (StickyBarC.tsx) can show it before
// the user commits to the booking page. This is the change Direction C's own brief names
// for this surface ("the sticky bar shows the running selection... instead of a bare Book
// button"), not a structure change made on my own judgment.
//
// exists-check: `npm run exists "salon page"` (see build notes) confirms SalonServices.tsx
// is the real row anatomy; this file duplicates it rather than editing the shared original
// (off-limits per the fan-out brief).
//
// Depicts: filter pills + grouped service rows -> app/[locale]/_components/salon/SalonServices.tsx (byte-identical anatomy, only the Book control's behaviour changes below).
// Depicts: chosen-row highlight fill -> app/[locale]/_components/primitives/TabPill.tsx (same locked calm fill: bg-s-bg-sunken + text-s-ink + semibold, reused verbatim, not invented).
// Depicts: "See all" link -> app/[locale]/_components/salon/SalonServices.tsx (unchanged SeeAllButton call, still routes straight to the booking flow).

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { Service, SalonDetail } from "@/app/[locale]/_components/salon/_shared";
import { capitalize } from "@/app/[locale]/_components/salon/_shared";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { PriceFrom, SeeAllButton, ServiceDisclosureRow } from "@/app/[locale]/_components/primitives";
import { useEnterMotion } from "@/app/[locale]/_components/primitives/motion";
import { localizedField } from "@/lib/i18n/localized-field";
import { cn } from "@/lib/utils";
// REPAIR 2026-09-05: FROM_LABEL reuse (rule 12, don't re-declare), same import the real
// SalonServices.tsx uses at line 12, the locale "ab"/"from"/"des"/"da" price-prefix map.
// Was hardcoded label="ab" (German) on this English mockup route; fixed below.
import { FROM_LABEL } from "@/app/[locale]/_components/search/SalonResultCard";

function formatDurationDE(mins: number): string {
  return `${mins} min`;
}

export function ServicesLead({
  services,
  locale,
  slug,
  salon,
  chosenId,
  onChoose,
}: {
  services: Service[];
  locale: string;
  slug: string;
  salon: SalonDetail;
  chosenId: string | null;
  onChoose: (service: Service) => void;
}) {
  const t = useTranslations("salonDetail");
  const grouped = React.useMemo(() => {
    return services.reduce<Record<string, Service[]>>((acc, s) => {
      const key = s.subcategory ?? s.category ?? "andere";
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
      <section id="section-services">
        <SectionHeader>Services</SectionHeader>
        <p className="font-body mt-4 text-[14px] text-s-ink-2">
          This salon has not listed any services yet.
        </p>
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
    <section id="section-services">
      <SectionHeader>Services</SectionHeader>

      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <TabPill key={c} active={activeCat === c} onClick={() => setActiveCat(c)} size="sm">
              {c === "alle" ? "All" : capitalize(c)}
            </TabPill>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-8">
        {shownGroups.map((g) => (
          <section key={g.key}>
            <h3 className="font-display mb-3 text-[16px] font-semibold capitalize tracking-[-0.01em] text-s-ink">
              {capitalize(g.key)}
            </h3>
            <ul className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
              {g.items.map((s) => (
                <ServiceRow
                  key={s.id}
                  service={s}
                  chosen={chosenId === s.id}
                  onChoose={onChoose}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {visible.length > 0 && (
        <div className="mt-5 flex justify-center">
          <SeeAllButton label={t("viewAllServices")} href={`/${locale}/salon/${slug}/booking`} />
        </div>
      )}
    </section>
  );
}

function ServiceRow({
  service,
  chosen,
  onChoose,
}: {
  service: Service;
  chosen: boolean;
  onChoose: (service: Service) => void;
}) {
  const t = useTranslations("salonDetail");
  const locale = useLocale();
  const checkMotion = useEnterMotion();
  // mockup-ok, English rule: the real SalonServices.tsx reads service.name_de unconditionally
  // (grepped before this fix), a pre-existing i18n gap on the live page this direction does
  // not otherwise touch. This copy is mine per the brief's own allowance, and the FORMAT LAW
  // requires English-only copy on this route, so it resolves through localizedField's
  // locale-aware de/en fallback chain instead of carrying the hardcoded German field forward.
  const serviceName = localizedField(service as unknown as Record<string, unknown>, "name", locale);

  const inner = (
    <div className="flex items-center justify-between gap-4">
      <ServiceDisclosureRow
        title={
          <div className="font-body text-[15px] font-medium text-s-ink md:text-[16px]">
            {serviceName}
          </div>
        }
        meta={
          <div className="font-body mt-1 text-[13px] text-s-ink-2 md:text-[14px]">
            {formatDurationDE(service.duration_minutes)}
          </div>
        }
        description={service.description_de}
        price={
          <div className="font-body mt-3 flex items-center gap-1.5 text-[14px] text-s-ink md:text-[15px]">
            <PriceFrom amount={service.price} label={FROM_LABEL[locale] ?? FROM_LABEL.en} emphasis />
            {chosen && (
              <motion.span {...checkMotion} className="inline-flex text-s-ink" aria-hidden>
                <Check size={15} strokeWidth={2.4} />
              </motion.span>
            )}
          </div>
        }
      />
      {/* mockup-ok: this button REPLACES SalonServices.tsx's <Link> per Direction C's one
          named change (see file header): it marks the running pick instead of navigating
          immediately, so StickyBarC can show it. Class string kept identical to the real
          Book link so the visible control reads the same either way. */}
      <button
        type="button"
        onClick={() => onChoose(service)}
        aria-pressed={chosen}
        className={cn(
          "font-body shrink-0 rounded-full border px-5 py-2 text-[13px] font-medium transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide md:px-6 md:py-2.5 md:text-[14px]",
          chosen
            ? "border-s-border bg-s-bg-sunken text-s-ink font-semibold"
            : "border-s-border bg-white text-s-ink hover:bg-s-bg-sunken",
        )}
      >
        {t("book")}
      </button>
    </div>
  );

  return (
    <li
      className={cn(
        "border-t border-s-border px-5 py-4 transition-colors duration-200 first:border-t-0 md:px-6",
        chosen && "bg-s-bg-sunken",
      )}
    >
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
