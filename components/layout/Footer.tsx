"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

/**
 * Footer — Component Map §20
 *
 * Design intent: "This footer should feel clean and professional because
 * it's the last thing users see — no clutter."
 *
 * - Background: #2C2825 (matches dark theme)
 * - Sprout icon + 'SOLEN' in Bebas Neue 24px (brand wordmark)
 * - Tagline: 'Die Schweizer Salon-Plattform.' DM Sans 14px/400
 * - 2 link columns: PLATTFORM + FÜR SALONS
 * - RECHTLICHES section
 * - Language toggle: DE · EN · FR · IT
 * - Copyright: dynamic year
 * - NO social icons, NO nDSG badge
 */

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer") as any;

  return (
    <footer style={{ background: "#2C2420" }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 lg:px-20 py-12">

        {/* ── Brand wordmark ── */}
        <div className="mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2" aria-label="solen.ch — Startseite">
            {/* Sprout icon */}
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M20 36V20" stroke="#8C8279" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 24C20 24 10 22 8 14C8 14 18 12 20 20" fill="#E8735A" opacity=".85"/>
              <path d="M20 20C20 20 30 18 32 10C32 10 22 8 20 16" fill="#E8735A"/>
            </svg>
            <span className="font-display text-white" style={{ fontSize: 24, letterSpacing: 1.5 }}>
              SOLEN
            </span>
          </Link>
          <p className="font-body text-sm mt-2" style={{ color: "#9E958C" }}>
            {t("tagline") || "Die Schweizer Salon-Plattform."}
          </p>
        </div>

        {/* ── 2 Link Columns ── */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* PLATTFORM */}
          <div>
            <h3
              className="font-heading text-[11px] font-bold uppercase tracking-[.1em] mb-4"
              style={{ color: "#9E958C" }}
            >
              {t("platform") || "Plattform"}
            </h3>
            <ul className="space-y-2">
              {[
                { label: t("platformDiscover") || "Entdecken", href: `/${locale}/discover` },
                { label: t("platformSearch") || "Suchen", href: `/${locale}/search` },
                { label: t("platformOffers") || "Angebote", href: `/${locale}/angebote` },
                { label: t("platformLastMinute") || "Last Minute", href: `/${locale}/angebote` },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="font-body text-sm hover:text-white transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* FÜR SALONS */}
          <div>
            <h3
              className="font-heading text-[11px] font-bold uppercase tracking-[.1em] mb-4"
              style={{ color: "#9E958C" }}
            >
              {t("forSalonsTitle") || "Für Salons"}
            </h3>
            <ul className="space-y-2">
              {[
                { label: t("forSalonsPartner") || "Partner werden", href: `/${locale}/partner` },
                { label: t("forSalonsDashboard") || "Dashboard", href: `/${locale}/dashboard` },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="font-body text-sm hover:text-white transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RECHTLICHES ── */}
        <div className="mb-6" style={{ marginTop: 24 }}>
          <h3
            className="font-heading text-[11px] font-bold uppercase tracking-[.1em] mb-3"
            style={{ color: "#9E958C" }}
          >
            {t("legalTitle") || "Rechtliches"}
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: t("help") || "Hilfe", href: `/${locale}/help` },
              { label: t("impressum") || "Impressum", href: `/${locale}/impressum` },
              { label: t("agb") || "AGB", href: `/${locale}/agb` },
              { label: t("privacy") || "Datenschutz", href: `/${locale}/datenschutz` },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="font-body text-xs hover:text-white transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bottom: copyright + language toggle ── */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p className="font-body text-xs" style={{ color: "#9E958C" }}>
            © {new Date().getFullYear()} solen.ch — Alle Rechte vorbehalten.
          </p>
          <LanguageSwitcher locale={locale} variant="footer" />
        </div>
      </div>
    </footer>
  );
}
