"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { SearchX } from "lucide-react";

/**
 * 404 page. V3-D311 (W9 follow-up, 2026-05-27): retired coral+amber gradient
 * replaced with neutral sunken surface + lucide icon (was a woman-in-steamy-room
 * emoji — violated LOCKFILE §0 rule 1 "no emoji anywhere"); primary CTA →
 * bg-s-ink (§0.2); ghost CTA hover → ink (was hover:s-coral); H1 normalized
 * to Page H2 spec.
 */
export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations("errors");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center max-w-[500px]">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-s-bg-sunken mb-6">
            <SearchX size={40} strokeWidth={1.75} className="text-s-ink-2" aria-hidden />
          </div>
        </div>

        <h1 className="font-heading text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink mb-2">
          {t("404_title") || "Ups! Diese Seite gibt es nicht"}
        </h1>

        <p className="font-body text-base text-s-ink-2 mb-8 leading-relaxed">
          {t("404_description") || "Vielleicht wurde sie verschoben oder existiert nicht mehr. Wir helfen dir gerne zurück."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className="px-6 py-3 rounded-btn bg-s-ink text-white font-heading text-sm hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150"
          >
            {t("404_home") || "Zur Startseite"}
          </Link>
          <Link
            href={`/${locale}/coiffeur`}
            className="px-6 py-3 rounded-btn border border-s-border text-s-ink font-heading text-sm hover:border-s-ink transition-[transform,filter,border-color] duration-150"
          >
            {t("404_browse") || "Salons entdecken"}
          </Link>
        </div>
      </div>
    </div>
  );
}
