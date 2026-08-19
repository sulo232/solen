"use client";

// WalkInBand — homepage walk-in rail (mockup-approved 2026-06-04, replaces the
// old dark teaser band). White card-band with depth, design-system blue accent
// (s-accent #276EF1) on the live wait + CTA, queue dots, swipeable shop chips
// (2 full + a ~1/4 peek so the rail reads scrollable), and an "Alle Walk-ins"
// button. Renders the same for everyone (not personalized).
//
// DATA (wired 2026-06-09): fetches GET /api/walkin/nearby on mount → real
// walk-in-enabled salons WITH live wait/queue (shared getWalkinAvailability).
// - Wait shown as a conservative RANGE (waitMinutes-waitMinutesMax); 0 → "Sofort frei".
// - Queue dots driven by real queueLength; 0 waiting → "Niemand wartet".
// - Meta line is the real street address (no geolocation → never a fake distance).
// - Each chip → that salon's PDP in WALK-IN mode (?walkin=1, read by SalonDetailV3);
//   "Alle Walk-ins" → the barbershop search with the walk_in filter applied.
// - 0 walk-in salons (feature off / none enabled) → the whole band hides (null).
// - 1 salon → single full-width chip (no peek).

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

export default function WalkInBand() {
  // 2026-08-15 i18n sweep: these were hardcoded German literals, so they rendered German
  // on /en, /fr and /it. Same class the owner caught on the recently-viewed row.
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
        console.error("[WalkInBand] failed to load walk-in availability:", err);
        if (active) setSalons([]);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Hide the whole band when there are no walk-in salons (feature off / none enabled).
  if (!loading && (!salons || salons.length === 0)) return null;

  const single = !loading && salons != null && salons.length === 1;

  return (
    // 2026-07-17 rhythm decision (TASTE_LOG.md, shipped as Section's py-2/mb-4
    // on SectionHeader.tsx): this section had NO top/bottom padding of its own
    // (only px), so it inherited whatever the neighbor sections left over.
    // Added pt-2 pb-2 (md:pt-3 pb-3) to match the primitive's inner py, and
    // mb-2 -> mb-4 mobile (desktop was already mb-4) to match its outer margin.
    // Arithmetic (mobile): prior Section's py-2(8)+mb-4(16)=24, + this
    // section's own pt-2(8) = 32 into it; this section's own pb-2(8)+mb-4(16)
    // =24, + next Section's py-2(8) = 32 out of it.
    <section aria-label="Walk-in" className="relative z-[1] mb-4 md:mb-4">
      <div className="mx-auto max-w-[1280px] px-4 pt-2 pb-2 md:px-6 md:pt-3 md:pb-3">
          {/* header */}
          <div className="flex items-center gap-3.5">
            <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[15px] bg-s-bg-sunken">
              <Image
                src="/icons/categories/walkin.png"
                alt=""
                width={64}
                height={64}
                className="h-[66%] w-[66%] object-contain"
              />
            </span>
            <div>
              {/* Eyebrow "BARBERSHOP" deleted 2026-06-11 (owner-approved every-state
                  home mockup): tracked-uppercase eyebrows are banned; the H2 + sub carry it. */}
              <h2 className="font-display text-[18px] font-semibold leading-[1.05] tracking-[-0.01em] text-s-ink">
                Walk-in
              </h2>
              <p className="mt-1 font-body text-[12px] leading-[1.3] text-s-ink-2">
                {t("walkInSub")}
              </p>
              {/* B "live board" (owner pick 2026-06-29): wait/queue are real-time (GET
                  /api/walkin/nearby), so a "Live" marker is honest signal, not decoration. */}
              {/* mockup-ok: R3 fix, ink label + green dot carries color (approved public/_mockups/home-refined) */}
              <span className="mt-1 inline-flex items-center gap-1.5 font-body text-[12px] font-semibold text-s-ink">
                <span className="h-[7px] w-[7px] rounded-full bg-s-success" aria-hidden />
                Live
              </span>
            </div>
          </div>

          {/* swipeable shop chips */}
          <div className="-mr-4 md:-mr-6 mt-4 flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loading
              ? [0, 1].map((i) => (
                  <div
                    key={i}
                    className="flex-[0_0_42%] min-w-0 snap-start rounded-[13px] border border-s-border bg-white p-3 shadow-[0_6px_16px_rgba(0,0,0,0.05)]"
                  >
                    {/* mockup-ok: WCAG 2.2.2 conformance, mount-load skeleton bounded (tailwind.config.js pulse-bounded) */}
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
                      {/* R1 "located" (owner pick 2026-06-29): wait-range hero + "bis frei", then
                          name + rating (gold star is the separator), then address + queue on their OWN
                          lines , NO middot between two same-weight metadata bits (taste rule 2). */}
                      <div className="font-display text-[20px] font-semibold leading-none tracking-[-0.02em] text-s-success">
                        {sofort ? "Jetzt frei" : `${s.waitMinutes}-${s.waitMinutesMax} Min`}
                      </div>
                      {!sofort && (
                        <div className="mt-[3px] font-body text-[12px] font-semibold text-s-ink-2">{t("untilFree")}</div>
                      )}
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="truncate font-heading text-[14px] font-semibold text-s-ink">{s.name}</span>
                        {/* B15 (PSYCHOLOGY law 6): reviewCount was already gated on but never
                            printed, a bare rating. Now shows the count it was gated on. mockup-ok */}
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

          {/* CTA */}
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
