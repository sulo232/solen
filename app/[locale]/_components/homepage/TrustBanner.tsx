/**
 * Trust banner — V3 (LIVE_TRUTH §Q51.8).
 *
 * Dark-section component: ink bg + brand-pale stats + white labels.
 * Sits near the bottom of the homepage as social proof.
 *
 * Layout:
 *   Desktop (≥ 900px): 2-col grid (1fr title-side / 2fr stats-side)
 *   Mobile (< 900px): single-col stacked
 *
 * Server component. Stats are static for now; Phase 2 wires from a
 * `/api/platform-stats` endpoint that aggregates Supabase counts +
 * caches at edge for the homepage.
 *
 * NOT in this commit:
 *   - Real platform stats query — hardcoded V2-D## numbers below
 *   - Animated count-up on scroll (defer — IntersectionObserver +
 *     CountUp component would be a separate Phase 0 primitive)
 */

interface TrustStat {
  /** Display number e.g. "853", "12.4k", "87k". */
  num: string;
  /** Label below the number. */
  label: string;
}

const STATS: TrustStat[] = [
  { num: "853", label: "Salons in 3 Städten" },
  { num: "12,4k", label: "Echte Bewertungen" },
  { num: "87k", label: "Buchungen / Jahr" },
];

export default function TrustBanner() {
  return (
    <section
      className="relative z-[1] mt-16 bg-s-ink px-8 py-20 text-white md:py-24"
      aria-labelledby="trust-banner-heading"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
        {/* Title side */}
        <div>
          <span className="font-body mb-3 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.18em] text-s-brand-pale before:block before:h-[5px] before:w-[5px] before:rounded-full before:bg-s-brand-pale before:opacity-70 before:content-['']">
            Solen in Zahlen
          </span>
          <h2
            id="trust-banner-heading"
            className="font-display text-[clamp(32px,4vw,48px)] font-black leading-none tracking-[-0.02em] text-white"
          >
            Die Schweiz bucht bei Solen.
          </h2>
        </div>

        {/* Stats side — 3 col always (mobile-friendly: stays 3-up via tighter gap) */}
        <div className="grid grid-cols-3 gap-6 md:gap-8">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-[clamp(40px,6vw,64px)] font-black leading-none tabular-nums text-s-brand-pale">
                {s.num}
              </div>
              <div className="mt-2 text-[14px] tracking-[0.04em] text-white/60">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
