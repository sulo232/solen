import Link from "next/link";
import { Instagram, Facebook, ChevronRight } from "lucide-react";

/**
 * V3 Footer — variant C "nav hub" (2026-06-05, owner pick).
 *
 * Newsletter band on top (sunken strip), then brand + social and four link
 * sections (Solen / Für Salons / Hilfe / Rechtliches), then a legal bar with
 * a language row. Replaces the prior 2-column + Versprechen + SolenStamp
 * layout now that the company pages exist and the footer is a real nav hub.
 *
 * Swiss flag is an inline SVG (no emoji, per house rule). Server component;
 * newsletter is a plain form POST to /api/newsletter/subscribe (no JS needed).
 *
 * Every href below points to a route that exists (verified 2026-06-05):
 *   /ueber-uns /karriere /presse /blog · /fuer-salons /business /partner ·
 *   /help /sicherheit /kontakt · /privacy /terms /impressum · /{locale} homes.
 */
const COLUMNS: Array<{ heading: string; items: Array<{ label: string; href: string }> }> = [
  {
    heading: "Solen",
    items: [
      { label: "Über uns", href: "/ueber-uns" },
      { label: "Karriere", href: "/karriere" },
      { label: "Presse", href: "/presse" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Für Salons",
    items: [
      { label: "Für Salons", href: "/fuer-salons" },
      { label: "Salon-Hilfe", href: "/business" },
      { label: "Partner werden", href: "/partner" },
    ],
  },
  {
    heading: "Hilfe",
    items: [
      { label: "Kund:innen-Hilfe", href: "/help" },
      { label: "Sicherheit", href: "/sicherheit" },
      { label: "Kontakt", href: "/kontakt" },
    ],
  },
  {
    heading: "Rechtliches",
    items: [
      { label: "Datenschutz", href: "/privacy" },
      { label: "AGB", href: "/terms" },
      { label: "Impressum", href: "/impressum" },
    ],
  },
];

const LOCALES = [
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "it", label: "IT" },
];

/** Inline Swiss flag — red rounded square + white cross. Intentional real color
 *  (a national flag is factual, like the rating star keeping its yellow). */
function SwissFlag() {
  return (
    <svg width="13" height="13" viewBox="0 0 32 32" aria-hidden className="inline-block rounded-[2px]" style={{ verticalAlign: "-1px" }}>
      <rect width="32" height="32" rx="3" fill="#DA291C" />
      <rect x="13" y="6" width="6" height="20" fill="#fff" />
      <rect x="6" y="13" width="20" height="6" fill="#fff" />
    </svg>
  );
}

export default function Footer({ locale }: { locale: string }) {
  const p = `/${locale}`;

  return (
    <footer className="relative z-[1] bg-white/45 backdrop-blur-[22px] backdrop-saturate-[1.6]">
      {/* ───────────── Newsletter band ───────────── */}
      <div className="border-b border-s-border bg-s-bg-sunken">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-7 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h3 className="font-display text-[17px] font-semibold tracking-tight text-s-ink">
              Bleib auf dem Laufenden
            </h3>
            <p className="mt-0.5 font-body text-[13px] text-s-ink-2">
              Neue Salons, Trends und Tipps. Einmal im Monat.
            </p>
          </div>
          <form
            method="post"
            action="/api/newsletter/subscribe"
            className="relative w-full max-w-[360px]"
            aria-label="Newsletter abonnieren"
          >
            <label htmlFor="footer-newsletter-email" className="sr-only">E-Mail-Adresse</label>
            <input
              id="footer-newsletter-email"
              type="email"
              name="email"
              required
              placeholder="deine@email.ch"
              className="w-full rounded-[12px] border border-s-border bg-white py-[12px] pl-[14px] pr-[48px] font-body text-[14px] text-s-ink outline-none transition-colors placeholder:text-s-ink-3 focus:border-s-ink"
            />
            <button
              type="submit"
              aria-label="Abonnieren"
              className="absolute right-[6px] top-[6px] grid h-9 w-9 place-items-center rounded-[9px] bg-s-ink text-white transition-transform duration-200 ease-glide active:scale-95"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </form>
        </div>
      </div>

      {/* ───────────── Body: brand + 4 link sections ───────────── */}
      <div className="bg-white px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:gap-10">
          {/* Brand column (full width on mobile) */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href={p}
              aria-label="Solen Startseite"
              className="font-display inline-flex items-baseline text-[22px] font-black leading-none tracking-normal text-s-ink"
            >
              Solen
            </Link>
            <p className="mt-3 max-w-[280px] font-body text-[13px] leading-relaxed text-s-ink-2">
              Beauty &amp; Wellness Booking für die ganze Schweiz.
            </p>
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
                  className="grid h-9 w-9 place-items-center rounded-[10px] bg-s-bg-sunken text-s-ink-3 transition-colors duration-200 ease-glide hover:bg-s-ink hover:text-white"
                >
                  <Icon size={16} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-4 font-body text-[14px] font-bold text-s-ink">{col.heading}</h4>
              <ul className="flex flex-col gap-3">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={`${p}${item.href}`}
                      className="font-body text-[13px] text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ───────────── Legal bar + language row ───────────── */}
        <div className="mx-auto mt-12 flex max-w-[1280px] flex-col gap-3 border-t border-s-border pt-6 font-body text-[11px] font-bold uppercase tracking-[0.14em] text-s-ink-3 md:flex-row md:items-center md:justify-between md:gap-8">
          <span className="inline-flex items-center gap-1.5">
            © {new Date().getFullYear()} Solen.ch Schweiz <SwissFlag />
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {LOCALES.map((l) => (
              <Link
                key={l.code}
                href={`/${l.code}`}
                aria-current={l.code === locale ? "true" : undefined}
                className={l.code === locale ? "text-s-ink" : "transition-colors hover:text-s-ink"}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
