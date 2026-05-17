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
 * Brand: neutral cream background (NOT emerald) so it doesn't fight the
 * book CTA. The icon is brand emerald to keep the link affordance recognizable.
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
          <div className="font-body text-[14px] font-semibold text-s-ink">
            Gutscheine
          </div>
          <div className="font-body mt-0.5 text-[12px] leading-snug text-s-ink-3">
            Verschenke einen Tag Wohlbefinden bei {salonName}.
          </div>
        </div>
        <Link
          href={href}
          className="font-body shrink-0 rounded-full border border-s-ink bg-white px-5 py-2 text-[13px] font-semibold text-s-ink transition-colors hover:bg-s-ink hover:text-white"
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
        className="font-body group flex items-center gap-4 rounded-2xl border border-s-border bg-white p-4 transition-colors hover:bg-s-bg-sunken md:p-5"
      >
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-s-brand-subtle md:h-16 md:w-16">
          <Gift size={24} strokeWidth={2} className="text-s-brand md:h-7 md:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-body text-[15px] font-bold tracking-tight text-s-ink md:text-[16px]">
            Gutscheine
          </h3>
          <p className="mt-0.5 text-[13px] text-s-ink-3 md:text-[14px]">
            Verschenke einen Tag Wohlbefinden bei {salonName}.
          </p>
        </div>
        <ChevronRight size={18} strokeWidth={2.5} className="shrink-0 text-s-ink-3 transition-transform group-hover:translate-x-1" />
      </Link>
    </section>
  );
}
