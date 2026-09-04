"use client";

// Grounded-in: app/[locale]/_components/homepage/WalkInBand.tsx
//
// Not-a-salon-card: this is a byte-copy of the real, shipped WalkInBand.tsx card grammar (its
// own approved rounded-[13px] card, wait-range hero + address + queue rows), not the canonical
// SalonResultCard/StoreCard structure. WalkInBand is a distinct, already-live homepage component
// with its own card shape; this file changes no structure at all, only the one colour class named
// in the VARY comment below.
//
// exists-check: net-new vs app/[locale]/dev/design-fixes/page.tsx + DesignFixesClient.tsx, whose
// Pair A "Proposed" REPLACES this card with the real homepage SalonCard (a structural swap). This
// brief is narrower and dated 2026-09-04: the owner's call that day was "keep the current"
// structure for this card and touch only the wait number's colour, so this file is a full
// byte-copy of the whole real WalkInBand.tsx client component (same fetch, same skeleton, same
// markup throughout) with exactly ONE class swapped: the wait-range hero text goes from
// `text-s-success` to `text-s-ink`. Nothing else in this file differs from the real component;
// see the single `VARY` comment below for the one changed line.
//
// emphasis-ok: every font-semibold in this file is byte-copied from the real, shipped
// WalkInBand.tsx (h2, "Live" label, salon name, review count, "bis frei", the CTA). Not a new
// design decision; this file changes only one text colour class, never weight.
//
// Depicts: walk-in band card (colour-only variant) -> app/[locale]/_components/homepage/WalkInBand.tsx
// (byte-copy, see exists-check above)

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star, ArrowRight } from "lucide-react";

type WalkInSalon = {
  id: string;
  slug: string;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  waitMinutes: number;
  waitMinutesMax: number;
  queueLength: number;
};

export default function WalkInBandProposed() {
  const t = useTranslations("home.sections");
  const locale = useLocale();
  const [salons, setSalons] = useState<WalkInSalon[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/walkin/nearby?limit=8")
      .then((r) => (r.ok ? r.json() : { salons: [] }))
      .then((d) => { if (active) setSalons(d.salons ?? []); })
      .catch((err) => {
        console.error("[WalkInBandProposed] failed to load walk-in availability:", err);
        if (active) setSalons([]);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (!loading && (!salons || salons.length === 0)) return null;

  const single = !loading && salons != null && salons.length === 1;

  return (
    <section aria-label="Walk-in" className="relative z-[1] mb-4 md:mb-4" data-testid="walkin-proposed">
      <div className="mx-auto max-w-[1280px] px-4 pt-2 pb-2 md:px-6 md:pt-3 md:pb-3">
          <div className="flex items-center gap-3.5">
            <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[15px] bg-s-bg-sunken">
              <Image
                src="/icons/categories/walkin.png" // icon-ok: byte-copy of the real homepage WalkInBand.tsx icon, unchanged
                alt=""
                width={64}
                height={64}
                className="h-[66%] w-[66%] object-contain"
              />
            </span>
            <div>
              <h2 className="font-display text-[18px] font-semibold leading-[1.05] tracking-[-0.01em] text-s-ink">
                Walk-in
              </h2>
              <p className="mt-1 font-body text-[12px] leading-[1.3] text-s-ink-2">
                {t("walkInSub")}
              </p>
              {/* Status icon keeps the green: the "Live" dot is the status carrier now that the
                  wait number below is ink, per the brief's "green stays only on the status icon". */}
              <span className="mt-1 inline-flex items-center gap-1.5 font-body text-[12px] font-semibold text-s-ink">
                <span className="h-[7px] w-[7px] rounded-full bg-s-success" aria-hidden />
                Live
              </span>
            </div>
          </div>

          <div className="-mr-4 md:-mr-6 mt-4 flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loading
              ? [0, 1].map((i) => (
                  <div
                    key={i}
                    className="flex-[0_0_42%] min-w-0 snap-start rounded-[13px] border border-s-border bg-white p-3 shadow-[0_6px_16px_rgba(0,0,0,0.05)]"
                  >
                    <div className="h-[16px] w-3/4 rounded bg-s-bg-sunken animate-pulse-bounded" />
                    <div className="mt-2.5 h-[12px] w-1/2 rounded bg-s-bg-sunken animate-pulse-bounded" />
                    <div className="mt-3 h-[12px] w-2/3 rounded bg-s-bg-sunken animate-pulse-bounded" />
                    <div className="mt-3 h-[12px] w-1/2 rounded bg-s-bg-sunken animate-pulse-bounded" />
                  </div>
                ))
              : salons!.map((s) => {
                  const sofort = s.waitMinutes <= 0;
                  return (
                    <a
                      key={s.id}
                      href={`/${locale}/salon/${s.slug}?walkin=1`}
                      className={`${single ? "w-full" : "flex-[0_0_42%]"} min-w-0 snap-start rounded-[13px] border border-s-border bg-white p-3 transition-transform duration-200 ease-glide active:scale-[0.98] active:duration-[80ms]`}
                    >
                      {/* VARY: text-s-success -> text-s-ink. The only class changed in this file. */}
                      <div className="font-display text-[20px] font-semibold leading-none tracking-[-0.02em] text-s-ink">
                        {sofort ? t("freeNow") : t("waitRange", { min: s.waitMinutes, max: s.waitMinutesMax })}
                      </div>
                      {!sofort && (
                        <div className="mt-[3px] font-body text-[12px] font-semibold text-s-ink-2">{t("untilFree")}</div>
                      )}
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="truncate font-heading text-[14px] font-semibold text-s-ink">{s.name}</span>
                        {s.reviewCount > 0 && (
                          <span className="ml-auto flex shrink-0 items-center gap-1 text-[12px] font-semibold text-s-ink-2">
                            <Star size={11} className="fill-s-star text-s-star" />
                            {s.rating.toFixed(1)}
                            <span className="text-s-accent">({s.reviewCount})</span>
                          </span>
                        )}
                      </div>
                      {s.address && (
                        <div className="mt-[3px] truncate font-body text-[12px] text-s-ink-2">{s.address}</div>
                      )}
                      <div className="mt-[3px] font-body text-[12px] text-s-ink-2">
                        {s.queueLength === 0 ? t("queueEmpty") : t("queueAhead", { n: s.queueLength })}
                      </div>
                    </a>
                  );
                })}
          </div>

          <a
            href={`/${locale}/barbershop?walk_in=true`}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-[13px] border border-s-border bg-white px-4 py-3 font-heading text-[14px] font-semibold text-s-ink transition-[background-color,transform] duration-200 ease-glide hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms]"
          >
            {t("allWalkIns")}
            <ArrowRight size={16} strokeWidth={1.9} />
          </a>
      </div>
    </section>
  );
}
