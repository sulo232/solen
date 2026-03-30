"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Instagram } from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer") as any;

  const legalLinks = [
    { label: t("impressum"), href: `/${locale}/impressum` },
    { label: t("agb"),       href: `/${locale}/agb` },
    { label: t("privacy"),   href: `/${locale}/datenschutz` },
    { label: t("help"),      href: `/${locale}/help` },
  ];

  return (
    <footer className="bg-s-ink text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Row 1: Logo · Legal links · Language switcher */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">

          {/* Logo */}
          <Link href={`/${locale}`} aria-label="solen.ch — Startseite">
            <Image
              src="/logo.svg"
              alt="solen.ch"
              width={80}
              height={24}
              className="brightness-0 invert"
            />
          </Link>

          {/* Legal links */}
          <nav aria-label="Rechtliches" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {legalLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-[12px] font-heading font-medium text-white/45 hover:text-white/80 transition-colors duration-150 whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Language switcher */}
          <LanguageSwitcher locale={locale} variant="footer" />
        </div>

        {/* Row 2: Copyright · nDSG note · Instagram */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-heading text-white/30">
              {t("copyright", { year: new Date().getFullYear() })}
            </p>
            <span className="text-white/15 text-[11px]">·</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF6F] shrink-0" aria-hidden="true" />
              <p className="text-[10px] font-heading uppercase tracking-[.06em]" style={{ color: "rgba(76,175,111,.55)" }}>
                {t("fadpCompliant")}
              </p>
            </div>
          </div>

          <a
            href="https://instagram.com/solen.ch"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="solen.ch auf Instagram"
            className="text-white/35 hover:text-white/70 transition-colors duration-150"
          >
            <Instagram size={18} />
          </a>
        </div>

      </div>
    </footer>
  );
}
