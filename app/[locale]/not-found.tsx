"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Scissors } from "lucide-react";

/**
 * 404 page — LOCKFILE §15.3 typographic language (owner pick Option A,
 * 2026-06-11 video-audit). Supersedes the V3-D311 icon-disc layout: oversized
 * Inter Tight "404" with an ink→grey gradient fade + a snipping scissors
 * accent, human one-liner (no "Ups!" — §15.4 bans exclamation cheer), one ink
 * CTA + one blue text link. Personality lives here (dead zone), never in the
 * funnel. Reference: public/_mockups/everystate-v2/10-errors.html.
 */
export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations("errors");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center max-w-[500px]">
        <div className="relative inline-block leading-none">
          <span
            className="font-heading text-[clamp(96px,18vw,120px)] font-extrabold tracking-[-0.05em] bg-gradient-to-b from-s-ink from-30% to-[#BBBBBB] bg-clip-text text-transparent"
            aria-hidden
          >
            404
          </span>
          <Scissors
            size={26}
            strokeWidth={2}
            className="absolute -right-8 -top-1 -rotate-[24deg] text-s-ink-2"
            aria-hidden
          />
        </div>

        <h1 className="mt-5 font-heading text-[clamp(20px,2.8vw,24px)] font-bold leading-[1.1] tracking-[-0.02em] text-s-ink">
          {t("404_title")}
        </h1>

        <p className="mx-auto mt-3 max-w-[320px] font-body text-[14.5px] leading-relaxed text-s-ink-2">
          {t("404_description")}
        </p>

        <div className="mt-7 flex flex-col items-center gap-4">
          <Link
            href={`/${locale}/coiffeur`}
            className="rounded-btn bg-s-ink px-7 py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97]"
          >
            {t("404_browse")}
          </Link>
          <Link
            href={`/${locale}`}
            className="font-body text-[13.5px] font-semibold text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
          >
            {t("404_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
