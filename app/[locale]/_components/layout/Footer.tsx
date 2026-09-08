"use client";

import Link from "next/link";
import { Instagram, Facebook, ChevronRight, Check } from "lucide-react";
import { useState } from "react";
import LanguageSwitcher from "@/components-legacy/ui/LanguageSwitcher";
import { useTranslations } from "next-intl";

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
// COLUMNS now carries KEYS, not German strings (2026-07-27). It sits at module scope, outside
// any component, so a hook cannot reach it , the labels are resolved at the render site
// instead. Owner spotted the consequence: the footer was German on /en too, not just on the
// locales I had been checking. Every key below already existed or was added in the same pass;
// none of the copy is new invention.
const COLUMNS = [
  {
    headingKey: "company",
    items: [
      { labelKey: "aboutUs", href: "/ueber-uns" },
      { labelKey: "careers", href: "/karriere" },
      { labelKey: "press", href: "/presse" },
      { labelKey: "blog", href: "/blog" },
    ],
  },
  {
    headingKey: "forSalonsTitle",
    items: [
      // "Partner werden" duplicate row removed 2026-06-11: it pointed at the same
      // /partner route as "Für Salons" (li key={item.href} -> React dup-key error).
      { labelKey: "forSalons", href: "/partner" },
      { labelKey: "salonHelp", href: "/help" },
    ],
  },
  {
    headingKey: "help",
    items: [
      { labelKey: "customerHelp", href: "/help" },
      { labelKey: "safety", href: "/sicherheit" },
      { labelKey: "contact", href: "/kontakt" },
    ],
  },
  {
    headingKey: "legalTitle",
    items: [
      { labelKey: "privacy", href: "/privacy" },
      { labelKey: "agb", href: "/terms" },
      { labelKey: "impressum", href: "/impressum" },
    ],
  },
  // `as const` is load-bearing: next-intl types t() to the LITERAL union of keys in the
  // namespace, so a widened `string` fails to compile. That is the type system doing exactly
  // what it should , a typo in a key is a build error rather than a raw dotted path rendered
  // to a customer, which is what the old hardcoded German strings could never catch.
] as const;
// LOCALES removed 2026-07-27: the footer's four locale <Link>s were replaced by the shared
// LanguageSwitcher, which owns the locale list (LOCALE_LABELS in components-legacy/ui/
// LanguageSwitcher.tsx). Two copies of the list was how the footer could drift from the
// switcher in the first place.

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
  const tFooter = useTranslations("footer");
  const tNav = useTranslations("navigation");
  const p = `/${locale}`;

  return (
    // FIX A (2026-08-01, owner "weird divider thingy at the bottom", measured: the 45% white
    // blur wrapper over an already-white page washed the newsletter-strip/body seam into a milky
    // grey band. FLOORS LAW 4 wants exactly ONE boundary treatment; the strip below now carries
    // ONLY its sunken bg (no border-b), so the sunken-tray/white-body handoff is the single edge.
    <footer className="relative z-[1] bg-white"> {/* mockup-ok: owner-measured fix, literal instruction, tokens only */}
      {/* ───────────── Newsletter band ───────────── */}
      <div className="bg-s-bg-sunken"> {/* mockup-ok: drop redundant border-b, sunken bg is the ONE boundary */}
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-7 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h3 className="font-display text-[17px] font-semibold tracking-tight text-s-ink">
              {tFooter("newsletterTitle")}
            </h3>
            <p className="mt-0.5 font-body text-[13px] text-s-ink-2">
              {tFooter("newsletterSub")}
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
              aria-label={tNav("homeLink")}
              className="font-display inline-flex items-baseline text-[22px] font-bold leading-none tracking-normal text-s-ink"
            >
              Solen
            </Link>
            <p className="mt-3 max-w-[280px] font-body text-[13px] leading-relaxed text-s-ink-2">
              {tFooter("tagline")}
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
                  className="grid h-9 w-9 place-items-center rounded-xl bg-s-bg-sunken text-s-ink-2 transition-[colors,transform] duration-150 ease-glide hover:bg-s-ink hover:text-white active:scale-[0.94] active:duration-[80ms]"
                >
                  {/* 1.9 is strokeForSize(16) from lib/icon-stroke.ts. Set by hand because
                      `Icon` here is a variable holding Instagram or Facebook (see the list
                      above), so the sweep could not prove it was an icon and skipped it. */}
                  <Icon size={16} strokeWidth={1.9} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {COLUMNS.map((col) => (
            <div key={col.headingKey}>
              <h4 className="mb-4 font-body text-[14px] font-bold text-s-ink">{tFooter(col.headingKey)}</h4>
              <ul className="flex flex-col gap-3">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={`${p}${item.href}`}
                      className="font-body text-[13px] text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
                    >
                      {tFooter(item.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ───────────── Legal bar + language row ───────────── */}
        <div className="mx-auto mt-12 flex max-w-[1280px] flex-col gap-3 border-t border-s-border pt-6 font-body text-[12px] font-bold text-s-ink-2 md:flex-row md:items-center md:justify-between md:gap-8">
          <span className="inline-flex items-center gap-1.5">
            © {new Date().getFullYear()} Solen.ch Schweiz <SwissFlag />
          </span>
          {/* Was a row of <Link href={`/${code}`}>: it discarded the current path and dumped
              the visitor on that locale's HOMEPAGE, and it never set the NEXT_LOCALE cookie,
              so the choice did not survive the next navigation. Two of the three reasons
              "changing lang doesnt rlly work" (owner, 2026-07-27). Same LanguageSwitcher the
              mobile menu uses: it swaps the locale SEGMENT of the current pathname and writes
              the cookie, so you stay on the page you were reading. */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <LanguageSwitcher locale={locale} />
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
  const t = useTranslations("footer");
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
        <Check size={18} strokeWidth={1.9} className="text-s-success" aria-hidden />
        {t("newsletterSuccess")}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-[360px]"
      aria-label={t("newsletterFormLabel")}
    >
      <label htmlFor="footer-newsletter-email" className="sr-only">{t("newsletterEmailLabel")}</label>
      <input
        id="footer-newsletter-email"
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("newsletterEmailPlaceholder")}
        className="w-full py-[12px] pl-[14px] !pr-[48px] font-body text-[14px] text-s-ink outline-none transition-colors placeholder:text-s-ink-2" // mockup-ok: !important carve-out, base input rule (globals.css, V3-D-input-fill-2026-07-17) out-specifies plain pr-[48px] and collapses right padding to 16px, letting typed text run under the absolute submit button
      />
      {/* mockup-ok: DS-4 nested-radius formula (LOCKFILE:428-431, locked law). This
          button sits inset right-6/top-6 inside the input (rounded-[12px]); inner =
          12-6 = 6 (was rounded-[9px], off the formula). */}
      <button
        type="submit"
        aria-label={t("newsletterSubmitLabel")}
        disabled={status === "loading"}
        className="absolute right-[6px] top-[6px] grid h-9 w-9 place-items-center rounded-[6px] bg-s-ink text-white transition-transform duration-200 ease-glide active:scale-95 active:duration-[80ms] disabled:opacity-60"
      >
        <ChevronRight size={18} strokeWidth={1.9} aria-hidden />
      </button>
      {status === "error" && (
        <p className="mt-1.5 font-body text-[12px] text-s-error" role="alert">
          {t("newsletterError")}
        </p>
      )}
    </form>
  );
}
