"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Instagram } from "lucide-react";
import TrustBadges from "@/components/ui/TrustBadges";
import { CITY_SLUGS, getCityName } from "@/lib/cities";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

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
  const t = useTranslations("footer") as any;

  return (
    <footer className="bg-s-ink text-white">
      {/* ── Brand Banner ─────────────────────────────────────── */}
      <div className="text-center py-16 border-b border-white/[0.06]">
        <h2 className="font-display text-7xl md:text-8xl tracking-wider text-white/90">
          SO<span className="text-s-coral">.</span>LEN
        </h2>
        <p className="font-body italic mt-3 text-sm text-white/40">
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
            <ul className="space-y-2.5">
              {CATEGORIES.map(({ key, label }) => (
                <li key={key}>
                  <Link
                    href={`/${locale}/${key}`}
                    className="block text-[13px] font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities column */}
          <div>
            <h3 className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-white/45 mb-5">
              {t("cities")}
            </h3>
            <ul className="space-y-2.5">
              {CITY_SLUGS.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/${locale}/${slug}`}
                    className="block text-[13px] font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                  >
                    {getCityName(slug, locale)}
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
            <ul className="space-y-2.5">
              {[
                { label: t("impressum"), href: `/${locale}/impressum` },
                { label: t("agb"),       href: `/${locale}/agb` },
                { label: t("privacy"),   href: `/${locale}/datenschutz` },
                { label: t("help"),      href: `/${locale}/help` },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="block text-[13px] font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
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
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${locale}/partner`}
                  className="block text-[13px] font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                >
                  {t("becomePartner")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/onboarding/salon`}
                  className="block text-[13px] font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
                >
                  {t("registerSalon")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/dashboard`}
                  className="block text-[13px] font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
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
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://instagram.com/solen.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[13px] font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150"
                >
                  <Instagram size={13} />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Language switcher — footer */}
        <div className="mt-8 mb-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40 font-body">{t("changeLanguage")}</p>
          <LanguageSwitcher locale={locale} variant="footer" />
        </div>

        {/* Trust Badges */}
        <TrustBadges />

        {/* Divider */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-heading text-5xl sm:text-6xl tracking-[0.06em] uppercase text-white/90">
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
                  {t("fadpCompliant")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
