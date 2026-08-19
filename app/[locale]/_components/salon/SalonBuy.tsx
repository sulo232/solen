"use client";

import * as React from "react";
import Link from "next/link";
import { Gift, ChevronRight } from "lucide-react";

/**
 * SalonBuy — V2-D53.3 (2026-05-11).
 *
 * Gift card promo. Renders in two modes:
 *   • `variant="standalone"` (default): full card section, used on mobile
 *     between Portfolio and About.
 *   • `variant="sidebar"`: compact row inside SalonSidebar (desktop only).
 *
 * Both link to the existing /[locale]/salon/[slug]/gift-card page.
 *
 * Brand: bg-white background (NOT emerald) so it doesn't fight the
 * book CTA. The icon is brand emerald to keep the link affordance recognizable.
 *
 * V3-D193: substrate is pure white per atmosphere-revert.
 */
export function SalonBuy({
  locale,
  slug,
  salonName,
  variant = "standalone",
}: {
  locale: string;
  slug: string;
  salonName: string;
  variant?: "standalone" | "sidebar";
}) {
  const href = `/${locale}/salon/${slug}/gift-card`;

  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-body text-[14px] font-medium text-s-ink">
            Gutscheine
          </div>
          <div className="font-body mt-0.5 text-[12px] leading-snug text-s-ink-2">
            Verschenke einen Tag Wohlbefinden bei {salonName}.
          </div>
        </div>
        <Link
          href={href}
          className="font-body shrink-0 rounded-full border border-s-ink bg-white px-5 py-2 text-[13px] font-semibold text-s-ink transition-[colors,transform] hover:bg-s-ink hover:text-white active:scale-[0.97] active:duration-[80ms] active:ease-glide"
        >
          Kaufen
        </Link>
      </div>
    );
  }

  return (
    <section>
      <Link
        href={href}
        className="font-body group flex items-center gap-4 rounded-2xl bg-white shadow-float p-4 transition-shadow hover:shadow-elevation-3 md:p-5"
      >
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white md:h-16 md:w-16">
          <Gift size={24} strokeWidth={2.4} className="text-s-ink md:h-7 md:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-body text-[15px] font-medium tracking-tight text-s-ink md:text-[16px]">
            Gutscheine
          </h3>
          <p className="mt-0.5 text-[13px] text-s-ink-2 md:text-[14px]">
            Verschenke einen Tag Wohlbefinden bei {salonName}.
          </p>
        </div>
        <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2 transition-transform group-hover:translate-x-1" />
      </Link>
    </section>
  );
}
