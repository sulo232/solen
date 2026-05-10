import Link from "next/link";
import { Check, ChevronRight, Store } from "lucide-react";

/**
 * SalonRegister — V2-D46 (2026-05-09).
 *
 * REPURPOSED from V2-D45 WhySolen consumer-trust dark feature into a B2B
 * salon-acquisition CTA per user direction. Same dark-feature anatomy
 * (Lumière "More Than Just a Haircut" pattern, V3-themed) — image left
 * with floating stat card + copy/bullets right + CTA link — but the
 * audience flips from CONSUMER trust to SALON acquisition.
 *
 * File kept named WhySolen.tsx so existing imports don't break; logical
 * name is SalonRegister. Component default export reflects the new role.
 *
 * Anatomy:
 *   ┌──────────────────────────────────────────────┐
 *   │  [photo]    FÜR SALONS                        │
 *   │             Werde Solen-Partner.              │
 *   │             [B2B lede]                        │
 *   │             ✓ Mehr Sichtbarkeit               │
 *   │             ✓ Weniger Verwaltung              │
 *   │             ✓ Schnelle Auszahlung             │
 *   │  [stat]     Salon registrieren →              │
 *   └──────────────────────────────────────────────┘
 */

const FEATURES = [
  {
    title: "Mehr Sichtbarkeit",
    body: "Erreiche tausende neue Kund:innen in deiner Stadt, ohne Werbe-Budget.",
  },
  {
    title: "Weniger Verwaltung",
    body: "Buchungen, Erinnerungen, Stornierungen: alles automatisch.",
  },
  {
    title: "Schnelle Auszahlung",
    body: "Zahlungen direkt aufs Geschäftskonto. Keine Wartezeiten.",
  },
];

export default function SalonRegister() {
  return (
    <section className="relative z-[1] mx-auto max-w-[1280px] px-3 py-3 md:px-4 md:py-6 mb-1 md:mb-3">
      {/* V2-D48 EARTHEN WELLNESS LIGHT (2026-05-09): panel flipped from
          dark-moss bg → cream-warm bg + thin moss-soft border. CTA promoted
          from text-link to terracotta pill. Stat-card gets butter highlight. */}
      <div
        className="relative overflow-hidden rounded-[28px] md:rounded-[40px] shadow-[0_8px_24px_rgba(42,31,24,0.06)]"
        style={{ background: "#FAF2E5", border: "1.5px solid #1F5C42" }}
      >
        {/* V2-D49k: more aggressive mobile trim — left column (decorative
            green gradient + floating stat card) hidden entirely on mobile
            since the floating stat card was already `hidden md:flex` and
            the gradient alone carries no info. Saves ~200px of vertical
            scroll. Panel padding p-5 → p-4 on mobile, p-12 desktop kept.
            Per V2-D49i this section already trimmed once; user reported
            "still too long" so removing the decoration entirely. */}
        <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-[1fr_1fr] md:gap-12 md:p-12 lg:p-16">
          {/* Left — image card + floating stat (desktop only) */}
          <div className="relative hidden md:block">
            <div
              className="aspect-[16/9] md:aspect-square w-full rounded-[20px] md:rounded-[28px] shadow-[0_12px_32px_rgba(42,31,24,0.10)]"
              style={{
                /* V2-D48-2: emerald-forest gradient instead of moss */
                background:
                  "linear-gradient(135deg, #A8CFB8 0%, #1F5C42 60%, #0A2917 130%)",
              }}
              aria-hidden
            />
            {/* Floating partner-count stat card — butter highlight */}
            <div
              className="absolute -bottom-3 right-2 hidden md:flex flex-col gap-2 rounded-[20px] p-5 shadow-[0_12px_36px_rgba(42,31,24,0.12)] max-w-[180px]"
              style={{ background: "#F2D77B" }}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-s-brand text-white">
                  <Store size={18} aria-hidden />
                </div>
                <div>
                  <p className="font-display text-[22px] font-black leading-none text-s-ink">
                    1'200+
                  </p>
                  <p className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-s-ink-2">
                    Partner
                  </p>
                </div>
              </div>
              <p className="font-body text-[12px] leading-snug text-s-ink-2">
                Salons buchen schon mit Solen. Du auch?
              </p>
            </div>
          </div>

          {/* Right — copy + benefit bullets + CTA */}
          <div className="flex flex-col justify-center text-s-ink">
            <span className="font-body mb-3 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-s-accent-deep">
              Für Salons
            </span>
            <h2 className="font-display text-[clamp(28px,3.8vw,48px)] font-black leading-[1.1] tracking-normal text-s-ink">
              Werde<br />
              <span className="text-s-accent">Solen-Partner.</span>
            </h2>
            <p className="mt-4 font-body text-[14px] md:text-[15px] leading-relaxed text-s-ink-2 max-w-[420px]">
              Mehr Buchungen, weniger Aufwand. Solen bringt die richtigen
              Kund:innen zu dir: automatisiert, transparent, fair.
            </p>

            <div className="mt-6 flex flex-col gap-4 md:mt-8 md:gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-s-brand text-white mt-[2px]">
                    <Check size={14} strokeWidth={3} aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-body text-[15px] font-bold text-s-ink">
                      {f.title}
                    </h3>
                    <p className="font-body text-[13px] text-s-ink-2 leading-snug mt-[2px]">
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/business/signup"
              className="mt-6 md:mt-10 inline-flex items-center gap-2.5 self-start rounded-full bg-s-brand px-5 py-3 font-body text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(31,92,66,0.30)] transition-all duration-200 ease-glide hover:bg-s-brand-mid active:scale-[0.97] active:duration-[80ms]"
            >
              Salon registrieren
              <ChevronRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
