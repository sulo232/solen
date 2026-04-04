"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations("errors");

  return (
    <div className="min-h-screen bg-white dark:bg-s-dm-bg flex items-center justify-center px-5">
      <div className="text-center max-w-[500px]">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-s-coral to-s-amber mb-6">
            <span className="text-5xl">🧖‍♀️</span>
          </div>
        </div>

        <h1 className="font-heading font-bold text-3xl md:text-5xl text-s-ink dark:text-s-dm-text mb-2">
          {t("404_title") || "Ups! Diese Seite gibt es nicht"}
        </h1>

        <p className="font-body text-base text-s-ink/60 dark:text-s-dm-text/60 mb-8 leading-relaxed">
          {t("404_description") || "Vielleicht wurde sie verschoben oder existiert nicht mehr. Wir helfen dir gerne zurück!"}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className="px-6 py-3 rounded-pill bg-s-coral text-white font-heading font-bold text-[14px] hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"
          >
            {t("404_home") || "Zur Startseite"}
          </Link>
          <Link
            href={`/${locale}/coiffeur`}
            className="px-6 py-3 rounded-pill border border-s-ink/20 dark:border-white/20 text-s-ink dark:text-s-dm-text font-heading font-bold text-[14px] hover:border-s-coral hover:text-s-coral transition-[transform,filter] duration-150"
          >
            {t("404_browse") || "Salons entdecken"}
          </Link>
        </div>
      </div>
    </div>
  );
}
