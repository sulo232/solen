"use client";

// WalkInBand — homepage walk-in rail (mockup-approved 2026-06-04, replaces the
// old dark teaser band). White card-band with depth, design-system blue accent
// (s-accent #276EF1) on the live wait + CTA, queue dots, swipeable shop chips
// (2 full + a ~1/4 peek so the rail reads scrollable), and an "Alle Walk-ins"
// button. Renders the same for everyone (not personalized).
//
// TODO (data): SHOPS is static demo. Bind to GET /api/walkin/availability
// (?salon_ids=…) → { waitMinutes, waitMinutesMax, queueLength } per walk-in
// salon, fed by a "nearby walk-in salons" list. Render the wait as the RANGE
// (waitMinutes–waitMinutesMax). Edge cases: 0 free → "Keine Walk-ins frei"
// fallback line; city with no walk-in salons → render null (hide the band);
// 1 shop → single full-width chip, no peek.

import Image from "next/image";
import { useLocale } from "next-intl";
import { Star, ArrowRight } from "lucide-react";

type WalkInShop = {
  slug: string;
  name: string;
  rating: string;
  meta: string;
  wait: string; // range, e.g. "10–14"
  ahead: number; // people ahead in queue
  queue: number; // total dots shown
};

const SHOPS: WalkInShop[] = [
  { slug: "fade-lab", name: "Fade Lab", rating: "4.9", meta: "Barber · 800 m", wait: "10–14", ahead: 3, queue: 5 },
  { slug: "herr-und-co", name: "Herr & Co.", rating: "4.8", meta: "Barber · 1.1 km", wait: "15–20", ahead: 4, queue: 5 },
  { slug: "sharp-studio", name: "Sharp Studio", rating: "4.7", meta: "Barber · 1.4 km", wait: "8–11", ahead: 2, queue: 5 },
];

export default function WalkInBand() {
  const locale = useLocale();
  return (
    <section aria-label="Walk-in" className="relative z-[1] mb-2 md:mb-4">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
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
              <p className="font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-s-accent">
                Barbershop
              </p>
              <h2 className="mt-0.5 font-display text-[21px] font-bold leading-[1.05] tracking-[-0.01em] text-s-ink">
                Walk-in
              </h2>
            </div>
          </div>

          {/* swipeable shop chips */}
          <div className="-mr-4 md:-mr-6 mt-4 flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SHOPS.map((s) => (
              <a
                key={s.slug}
                href={`/${locale}/barbershop`}
                className="flex-[0_0_42%] min-w-0 snap-start rounded-[13px] border border-s-border bg-white p-3 shadow-[0_6px_16px_rgba(0,0,0,0.05)] transition-transform duration-200 ease-glide active:scale-[0.98]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-heading text-[14px] font-bold text-s-ink">{s.name}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[11.5px] font-semibold text-s-ink-2">
                    <Star size={11} className="fill-[#FFC32B] text-[#FFC32B]" />
                    {s.rating}
                  </span>
                </div>
                <div className="mt-[3px] truncate text-[11.5px] text-s-ink-2">{s.meta}</div>
                <div className="mt-2.5 inline-flex items-center gap-1.5 whitespace-nowrap text-[11.5px] font-bold text-s-accent">
                  <span className="h-[7px] w-[7px] rounded-full bg-s-accent" />
                  Frei in {s.wait} Min
                </div>
                <div className="mt-2.5 flex items-center gap-[7px] text-[11px] text-s-ink-2">
                  <span className="flex gap-[3px]">
                    {Array.from({ length: s.queue }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-[6px] w-[6px] rounded-full ${i < s.ahead ? "bg-s-ink" : "bg-s-border"}`}
                      />
                    ))}
                  </span>
                  {s.ahead} vor dir
                </div>
              </a>
            ))}
          </div>

          {/* CTA */}
          <a
            href={`/${locale}/barbershop`}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-[13px] bg-s-accent px-4 py-3 font-heading text-[14px] font-bold text-white shadow-[0_6px_14px_rgba(39,110,241,0.18)] transition-transform duration-200 ease-glide active:scale-[0.99]"
          >
            Alle Walk-ins
            <ArrowRight size={16} />
          </a>
      </div>
    </section>
  );
}
