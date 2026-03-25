"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Instagram } from "lucide-react";
import TrustBadges from "@/components/ui/TrustBadges";

const CATEGORIES = [
  { key: "coiffeur",   label: "Coiffeur"     },
  { key: "barbershop", label: "Barbershop"   },
  { key: "nails",      label: "Nails"        },
  { key: "spa",        label: "Spa & Massage" },
  { key: "makeup",     label: "Makeup"       },
  { key: "waxing",     label: "Waxing"       },
];

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");

  return (
    <footer className="bg-s-ink text-white">
      {/* ── Brand Banner ─────────────────────────────────────── */}
      <div className="text-center py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full pointer-events-none"
          style={{ background: "rgba(232,98,74,.10)", filter: "blur(60px)" }} />
        <h2 className="font-display relative z-10"
          style={{ fontSize: "clamp(44px, 6vw, 80px)", letterSpacing: "0.02em", color: "rgba(245,238,228,.90)" }}>
          SO<span style={{ color: "#E8624A" }}>.</span>LEN
        </h2>
        <p className="font-body italic mt-2 text-sm relative z-10" style={{ color: "rgba(245,238,228,.50)" }}>
          {t("tagline")}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          {/* Kategorien */}
          <div>
            <h3 className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-white/45 mb-5">
              {t("categories")}
            </h3>
            <ul className="space-y-2">
              {CATEGORIES.map(({ key, label }) => (
                <li key={key}>
                  <Link
                    href={`/${locale}/${key}`}
                    className="block text-xs font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <h3 className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-white/45 mb-5">
              {t("company")}
            </h3>
            <ul className="space-y-2">
              {[
                { label: t("impressum"), href: `/${locale}/impressum` },
                { label: t("agb"),       href: `/${locale}/agb` },
                { label: t("privacy"),   href: `/${locale}/datenschutz` },
                { label: t("help"),      href: `/${locale}/help` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="block text-xs font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Für Salons */}
          <div>
            <h3 className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-white/45 mb-5">
              {t("forSalons")}
            </h3>
            <p className="text-xs text-white/40 font-body mb-3">
              {t("salonPitch")}
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/partner`}
                  className="block text-xs font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                >
                  {t("becomePartner")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/onboarding/salon`}
                  className="block text-xs font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                >
                  {t("registerSalon")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/dashboard`}
                  className="block text-xs font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                >
                  {t("dashboard")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Sozial */}
          <div>
            <h3 className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-white/45 mb-5">
              {t("social")}
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://instagram.com/solen.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150"
                >
                  <Instagram size={13} />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <TrustBadges />

        {/* Divider */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-display text-5xl sm:text-6xl tracking-[0.06em] uppercase text-white/90">
              so<span className="text-s-coral">.</span>len
            </span>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-heading font-semibold uppercase tracking-[.14em] text-white/30">
                {t("copyright", { year: new Date().getFullYear() })}
              </p>
              <p className="text-[9px] font-heading uppercase tracking-[.10em] text-white/20 mt-1">
                {t("compliance")}
              </p>
              <div className="flex items-center justify-center sm:justify-end gap-1.5 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF6F]" />
                <p className="text-[9px] font-heading uppercase tracking-[.08em]" style={{ color: "rgba(76,175,111,.60)" }}>
                  nDSG-konform · Schweizer Datenschutz
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
