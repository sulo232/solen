import Link from "next/link";
import { Instagram, Facebook, ChevronRight } from "lucide-react";

/**
 * V3 Footer — V2-D49n "Negative footer" (2026-05-10).
 *
 * Replaces the V2-D46 multi-column footer with a Brün-style negative-footer
 * pattern: oversized brand wordmark cropped at the bottom edge of an
 * emerald panel, stacked above a cream/white body panel that holds the
 * actual content. The whole thing sits in a rounded card with shadow so
 * it reads as a "footer object on the page" rather than a full-bleed slab.
 *
 * Anatomy:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │            ╔════════════════════════════════════╗            │
 *   │            ║         GIANT  s o l e n  CROPPED  ║   ← emerald │
 *   │            ╚════════════════════════════════════╝     panel  │
 *   │  [brand] [tagline] [newsletter]  [Nav]  [Support]  [stamp]  │
 *   │  ─────────────────────────────────────────────────────────── │
 *   │  © 2026 Solen.ch · Datenschutz · AGB · Impressum             │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * The giant wordmark uses Peace Sans (font-display) at clamp(140px,30vw,320px),
 * positioned with negative bottom so the descender of `s` and the bowl of
 * `o` clip at the panel's bottom edge. `overflow-hidden` on the panel does
 * the actual cropping.
 *
 * Server component. Newsletter form is still a stub (Phase 1+ wires
 * `/api/newsletter/subscribe`).
 */

const COLUMNS: Array<{ heading: string; items: Array<{ label: string; href: string }> }> = [
  {
    heading: "Solen",
    items: [
      { label: "Über uns", href: "/about" },
      { label: "Karriere", href: "/careers" },
      { label: "Presse", href: "/press" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Hilfe",
    items: [
      { label: "Kund:innen-Hilfe", href: "/help" },
      { label: "Salon-Hilfe", href: "/business/help" },
      { label: "Sicherheit", href: "/safety" },
      { label: "Kontakt", href: "/contact" },
    ],
  },
];

const LEGAL: Array<{ label: string; href: string }> = [
  { label: "Datenschutz", href: "/privacy" },
  { label: "AGB", href: "/terms" },
  { label: "Impressum", href: "/imprint" },
  { label: "Cookies", href: "/cookies" },
];

export default function Footer({ locale }: { locale: string }) {
  const localePrefix = `/${locale}`;

  return (
    // V2-D49n-fu8 (2026-05-10): outer wrapper now carries the FeedZone's
    // white-glass bg so the emerald panel's rounded-top corner cutouts
    // reveal the SAME color as the FeedZone above. Eliminates the
    // cream-corner step-pattern user flagged. The body div below has its
    // own bg-white that takes over once the emerald ends.
    <footer className="relative z-[1] bg-white/45 backdrop-blur-[22px] backdrop-saturate-[1.6]">
      {/* ───────────── Negative panel (emerald + cropped wordmark) ─────────────
          V2-D49n-fu / fu2 / fu3 / fu7 / fu8 (2026-05-10):
            fu  — full-bleed, no card framing
            fu2 — rounded top + rising-panel pattern
            fu3 — `bg-white` moved to body div
            fu7 — top margin removed, FeedZone pb shrunk to flow into footer
            fu8 — outer wrapper gets glass-bg so rounded corners reveal
                  FeedZone-matching glass, not cream page bg */}
      <div className="relative h-[140px] md:h-[260px] bg-s-brand overflow-hidden rounded-t-[28px] md:rounded-t-[40px] shadow-[0_-8px_24px_rgba(4,51,56,0.06)] md:shadow-[0_-12px_32px_rgba(4,51,56,0.08)]">
        <span
          aria-hidden
          className="font-display absolute left-0 right-0 text-center text-white font-black leading-none tracking-[-0.03em] select-none"
          style={{
            // V2-D49n-fu6 (2026-05-10): final dial. Iteration: 240 too
            // short → 460 too big → 380 still too tall → 300 / 300 (panel /
            // max font) — wordmark fills panel cleanly with the right
            // amount of cropping at the bottom, no excess green above.
            fontSize: "clamp(140px, 24vw, 260px)",
            // Negative bottom pulls the wordmark down so the bowl of `o`
            // and descender of `s` get clipped at the panel's bottom edge.
            // The `overflow-hidden` parent does the actual cropping.
            bottom: "-18%",
          }}
        >
          solen
        </span>
        {/* Subtle radial highlight for depth — pointer-events-none so it
            doesn't interfere with hover/focus on the body below. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(255,255,255,0.10)_0%,transparent_70%)]"
        />
      </div>

      {/* ───────────── Body (white, full-bleed bg, content max-width inside) ─────────────
          V2-D49n-fu9 (2026-05-10): mobile padding tightened (py-10→py-8) and
          grid restructured. Was `grid-cols-1` on mobile (all 4 sections stack
          vertically — ~600px tall body). Now `grid-cols-3` with the brand
          column spanning all 3 cols (full width) and the three link cols
          sitting side-by-side in one row — ~250px tall body. Long item text
          wraps to 2 lines on narrow cols but total height is far shorter
          than 4 stacked sections. Desktop layout unchanged. */}
      <div className="bg-white px-5 py-8 md:px-8 md:py-14">
        <div className="mx-auto grid max-w-[1280px] grid-cols-3 gap-x-4 gap-y-8 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:gap-10 md:gap-x-12">
            {/* Brand col — small wordmark + tagline + social.
                V2-D49n-fu9: col-span-3 on mobile (full width above the 3 link
                cols), col-span-1 on desktop (left column of the 5-col grid). */}
            <div className="col-span-3 md:col-span-1">
              <Link
                href={localePrefix}
                aria-label="Solen Startseite"
                className="font-display inline-flex items-baseline text-[22px] font-black leading-none tracking-normal text-s-ink"
              >
                Solen
                <span
                  aria-hidden
                  className="ml-[2px] inline-block h-2 w-2 rounded-full bg-s-accent"
                  style={{ transform: "translateY(-2px)" }}
                />
              </Link>
              <p className="mt-4 max-w-[280px] font-body text-[13px] leading-relaxed text-s-ink-2">
                Beauty &amp; Wellness Booking für die ganze Schweiz. Salons
                finden, sofort buchen, Komfort genießen.
              </p>
              <h3 className="mt-6 font-body text-[14px] font-bold text-s-ink">
                Newsletter
              </h3>
              <p className="mt-1.5 font-body text-[12px] text-s-ink-3">
                Tipps, neue Salons, monatlich.
              </p>
              <form
                method="post"
                action="/api/newsletter/subscribe"
                className="relative mt-3 max-w-[320px]"
                aria-label="Newsletter abonnieren"
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  E-Mail-Adresse
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  name="email"
                  required
                  placeholder="deine@email.ch"
                  className="w-full rounded-[12px] bg-s-ink/[0.05] py-[12px] pl-[14px] pr-[48px] font-body text-[14px] text-s-ink placeholder:text-s-ink-3 outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--s-brand-color)]"
                  style={{ ["--s-brand-color" as string]: "#1A8F5C" }}
                />
                <button
                  type="submit"
                  aria-label="Abonnieren"
                  className="absolute right-[6px] top-[6px] grid h-9 w-9 place-items-center rounded-[9px] bg-s-brand text-white transition-transform duration-200 ease-glide active:scale-95"
                >
                  <ChevronRight size={18} aria-hidden />
                </button>
              </form>
              <div className="mt-5 flex gap-2">
                {[
                  { Icon: Instagram, label: "Instagram", href: "https://instagram.com/solen.ch" },
                  { Icon: Facebook, label: "Facebook", href: "https://facebook.com/solen.ch" },
                ].map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded-[10px] bg-s-ink/[0.06] text-s-ink-3 transition-colors duration-200 ease-glide hover:bg-s-ink hover:text-white"
                  >
                    <Icon size={16} aria-hidden />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <h3 className="font-body text-[14px] font-bold text-s-ink mb-5">
                  {col.heading}
                </h3>
                <ul className="flex flex-col gap-3">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={`${localePrefix}${item.href}`}
                        className="font-body text-[13px] text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Material focus / brand-promise col — adapted from Brün's
                "Material Focus" → Solen's locked brand pillars (booking
                speed / no calls / fair pricing per LIVE_TRUTH §0d.5). */}
            <div>
              <h3 className="font-body text-[14px] font-bold text-s-ink mb-5">
                Versprechen
              </h3>
              <ul className="flex flex-col gap-3 font-body text-[13px] text-s-ink-2">
                <li>30 Sekunden buchen</li>
                <li>Ohne Anrufen</li>
                <li>Sofortige Bestätigung</li>
                <li>Faire Preise</li>
              </ul>
            </div>

            {/* Round brand-stamp badge — Brün's "CRAFTED BY NATURE" stamp,
                Solen-adapted: emerald ring with "SOLEN · SCHWEIZ · 2026"
                curved on the circle path. Center holds a single bold S. */}
            <div className="hidden md:flex items-start justify-end">
              <SolenStamp />
            </div>
          </div>

        {/* Bottom row — copyright + legal — own max-w wrapper so it aligns
            with the grid above while the body bg stays full-bleed. */}
        <div className="mx-auto mt-12 flex max-w-[1280px] flex-col items-center gap-3 border-t border-s-ink/[0.08] pt-6 font-body text-[11px] font-bold uppercase tracking-[0.15em] text-s-ink-3 md:flex-row md:justify-between md:gap-8">
          <span>
            © {new Date().getFullYear()} Solen.ch · Alle Rechte vorbehalten
          </span>
          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2">
            {LEGAL.map((item) => (
              <Link
                key={item.href}
                href={`${localePrefix}${item.href}`}
                className="transition-colors hover:text-s-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * V2-D49n: SolenStamp — circular brand badge in the footer's right column.
 * SVG `<textPath>` curves the wordmark "SOLEN · SCHWEIZ · 2026 ·" around
 * the circumference of an emerald ring. Center holds a bold S in display
 * font. Decorative — does not link anywhere (purely brand-mark presence).
 */
function SolenStamp() {
  return (
    <div className="relative grid h-24 w-24 place-items-center" aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-s-brand">
        <defs>
          <path
            id="solen-stamp-circle"
            d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
          />
        </defs>
        {/* Outer thin ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* Curved text */}
        <text
          fill="currentColor"
          fontSize="9"
          fontWeight="700"
          letterSpacing="2"
          style={{ textTransform: "uppercase" }}
        >
          <textPath href="#solen-stamp-circle" startOffset="0">
            SOLEN · SCHWEIZ · 2026 ·&nbsp;
          </textPath>
        </text>
        {/* Inner emerald disc */}
        <circle cx="50" cy="50" r="22" fill="currentColor" />
      </svg>
      {/* Center S — Peace Sans, white on emerald */}
      <span className="relative z-[1] font-display text-[24px] font-black leading-none text-white">
        S
      </span>
    </div>
  );
}
