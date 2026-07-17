"use client";

import Link from "next/link";
import { Instagram, Facebook, ChevronRight, Check } from "lucide-react";
import { useState } from "react";

/**
 * V3 Footer — variant C "nav hub" (2026-06-05, owner pick).
 *
 * Newsletter band on top (sunken strip), then brand + social and four link
 * sections (Solen / Für Salons / Hilfe / Rechtliches), then a legal bar with
 * a language row. Replaces the prior 2-column + Versprechen + SolenStamp
 * layout now that the company pages exist and the footer is a real nav hub.
 *
 * Swiss flag is an inline SVG (no emoji, per house rule). Client component;
 * the newsletter form submits JSON { email } to POST /api/newsletter via
 * fetch and shows an inline success state on 2xx.
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
      // "Partner werden" duplicate row removed 2026-06-11: it pointed at the same
      // /partner route as "Für Salons" (li key={item.href} -> React dup-key error).
      { label: "Für Salons", href: "/partner" },
      { label: "Salon-Hilfe", href: "/help" },
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
  // standalone-justified (punch-list geometry sweep, GEOMETRY_PRINCIPLES_2026-07-17.md:861):
  // not nested inside a padding parent (no DS-4 gap relationship applies), and the outer
  // rounded-[2px] clip tracks the flag's OWN internal rect rx="3" in a 32-unit viewBox scaled
  // to this 13px render (3/32*13 approx 1.2px). Snapping to the 4px ladder minimum would
  // roughly double the visible corner on a 13px glyph, a real visual change on a flag icon.
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
          <NewsletterForm />
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
                  // mockup-ok: snapped to rounded-xl (12px, on-ladder), punch-list geometry sweep
                  // (owner-approved law, TASTE_LOG.md:187 2026-07-15). Was rounded-[10px]
                  // (off-ladder), not nested (flex row, no padding parent), a 2px change on a
                  // 36px button is a trivially-snappable notation fix.
                  className="grid h-9 w-9 place-items-center rounded-xl bg-s-bg-sunken text-s-ink-3 transition-colors duration-200 ease-glide hover:bg-s-ink hover:text-white"
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
        <div className="mx-auto mt-12 flex max-w-[1280px] flex-col gap-3 border-t border-s-border pt-6 font-body text-[12px] font-bold text-s-ink-3 md:flex-row md:items-center md:justify-between md:gap-8">
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

/** Newsletter subscribe form. Submits JSON { email } to POST /api/newsletter
 *  (the real route; the schema is `z.object({ email })`). Shows an inline
 *  success state on 2xx and an inline error message otherwise. */
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("done");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("[Footer] Newsletter subscribe error:", err);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="flex w-full max-w-[360px] items-center gap-2 font-body text-[14px] text-s-ink" role="status">
        <Check size={18} className="text-s-success" aria-hidden />
        Danke! Du bist eingetragen.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-[360px]"
      aria-label="Newsletter abonnieren"
    >
      <label htmlFor="footer-newsletter-email" className="sr-only">E-Mail-Adresse</label>
      <input
        id="footer-newsletter-email"
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="deine@email.ch"
        className="w-full py-[12px] pl-[14px] !pr-[48px] font-body text-[14px] text-s-ink outline-none transition-colors placeholder:text-s-ink-3" // mockup-ok: !important carve-out, base input rule (globals.css, V3-D-input-fill-2026-07-17) out-specifies plain pr-[48px] and collapses right padding to 16px, letting typed text run under the absolute submit button
      />
      {/* mockup-ok: DS-4 nested-radius formula (LOCKFILE:428-431, locked law). This
          button sits inset right-6/top-6 inside the input (rounded-[12px]); inner =
          12-6 = 6 (was rounded-[9px], off the formula). */}
      <button
        type="submit"
        aria-label="Abonnieren"
        disabled={status === "loading"}
        className="absolute right-[6px] top-[6px] grid h-9 w-9 place-items-center rounded-[6px] bg-s-ink text-white transition-transform duration-200 ease-glide active:scale-95 disabled:opacity-60"
      >
        <ChevronRight size={18} aria-hidden />
      </button>
      {status === "error" && (
        <p className="mt-1.5 font-body text-[12px] text-s-error" role="alert">
          Eintragen fehlgeschlagen. Bitte versuch es erneut.
        </p>
      )}
    </form>
  );
}
