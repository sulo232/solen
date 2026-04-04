"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Instagram } from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer") as any;

  return (
    <footer className="bg-s-dm-bg text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

        {/* ── Logo + tagline ── */}
        <div className="mb-10">
          <Link href={`/${locale}`} aria-label="solen.ch — Startseite">
            <Image src="/logo.svg" alt="solen.ch" width={80} height={24} className="brightness-0 invert mb-3" />
          </Link>
          <p className="text-[13px] font-body text-white/40">{t("tagline")}</p>
        </div>

        {/* ── 3 columns ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pb-10 border-b border-white/[0.08]">

          {/* Column 1: Platform */}
          <div>
            <h3 className="font-heading font-semibold text-[12px] uppercase tracking-wider text-white/40 mb-4">
              {t("platform")}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: t("platformDiscover"), href: `/${locale}/discover` },
                { label: t("platformSearch"), href: `/${locale}/search` },
                { label: t("platformOffers"), href: `/${locale}/angebote` },
                { label: t("platformLastMinute"), href: `/${locale}/angebote` },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="font-body text-[13px] text-white/60 hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Für Salons */}
          <div>
            <h3 className="font-heading font-semibold text-[12px] uppercase tracking-wider text-white/40 mb-4">
              {t("forSalonsTitle")}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: t("forSalonsPartner"), href: `/${locale}/partner` },
                { label: t("forSalonsDashboard"), href: `/${locale}/dashboard` },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="font-body text-[13px] text-white/60 hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-heading font-semibold text-[12px] uppercase tracking-wider text-white/40 mb-4">
              {t("legalTitle")}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: t("help"), href: `/${locale}/help` },
                { label: t("impressum"), href: `/${locale}/impressum` },
                { label: t("agb"), href: `/${locale}/agb` },
                { label: t("privacy"), href: `/${locale}/datenschutz` },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="font-body text-[13px] text-white/60 hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom row: copyright + Instagram + language ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-heading text-white/30">
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
            <span className="text-white/15 text-[11px]">·</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-s-sage shrink-0" aria-hidden="true" />
              <p className="text-[10px] font-heading uppercase tracking-[.06em] text-s-sage/55">
                {t("fadpCompliant")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/solen.ch"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="solen.ch auf Instagram"
              className="text-white/35 hover:text-white/70 transition-colors duration-150"
            >
              <Instagram size={16} />
            </a>
            <LanguageSwitcher locale={locale} variant="footer" />
          </div>
        </div>

      </div>
    </footer>
  );
}
