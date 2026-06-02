"use client";

// WalkInBand (V3-D348, homepage tweak #5) — a single dark full-bleed feature
// band dropped mid-feed to break the run of identical card carousels (the feed
// was ~6 "title + horizontal row" sections back-to-back with no visual peak).
// Doubles as the entry point to the Walk-in flow. B&W: ink surface + white
// text + white CTA pill. Renders the same for everyone (not personalized).

import { useLocale } from "next-intl";

export default function WalkInBand() {
  const locale = useLocale();
  return (
    <section aria-label="Walk-in" className="relative z-[1] mb-2 md:mb-4">
      <div className="mx-auto max-w-[1280px] px-4 md:px-6">
        <a
          href={`/${locale}/barbershop`}
          className="block overflow-hidden rounded-card bg-s-ink px-5 py-6 md:px-8 md:py-8 transition-transform duration-200 ease-glide active:scale-[0.99]"
        >
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
            Walk-in
          </p>
          <h2 className="mt-2 font-display text-[20px] md:text-[24px] font-semibold leading-[1.15] tracking-[-0.01em] text-white">
            Jetzt zahlen, Nummer ziehen — kein Warten.
          </h2>
          <p className="mt-2 max-w-[440px] text-[13px] md:text-[14px] leading-[1.45] text-white/70">
            Zeig deine Nummer beim Salon. Live-Warteschlange direkt in der App.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-pill bg-white px-4 py-2 font-heading text-[13px] font-semibold text-s-ink">
            Walk-in finden →
          </span>
        </a>
      </div>
    </section>
  );
}
