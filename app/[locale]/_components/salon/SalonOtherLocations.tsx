"use client";

import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { SiblingSalon } from "./_shared";
import { capitalize } from "./_shared";

/**
 * SalonOtherLocations — V2-D53.3 (2026-05-11).
 *
 * Chain locations card. Renders only when `siblings.length > 0`.
 *
 * Layout:
 *   • 1 sibling: single full-width card
 *   • 2+ siblings: horizontal scroll carousel with peek
 *
 * Each card mirrors Fresha: image left + name + rating + address +
 * category label right. Click navigates to /salon/{sibling.slug}.
 */
export function SalonOtherLocations({
  siblings,
  locale,
}: {
  siblings: SiblingSalon[];
  locale: string;
}) {
  if (!siblings || siblings.length === 0) return null;

  return (
    <section>
      <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
        Andere Standorte
      </h2>

      {siblings.length === 1 ? (
        <div className="mt-5">
          <SiblingCard sibling={siblings[0]} locale={locale} fullWidth />
        </div>
      ) : (
        <div className="-mx-4 mt-5 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
          {siblings.map((s) => (
            <div key={s.id} className="w-[280px] shrink-0 snap-start md:w-[340px]">
              <SiblingCard sibling={s} locale={locale} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SiblingCard({
  sibling,
  locale,
  fullWidth = false,
}: {
  sibling: SiblingSalon;
  locale: string;
  fullWidth?: boolean;
}) {
  const category = sibling.categories?.[0] ?? "";
  return (
    <Link
      href={`/${locale}/salon/${sibling.slug}`}
      className="font-body group block overflow-hidden rounded-2xl border border-s-border bg-white transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-s-bg-sunken">
        {sibling.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sibling.cover_photo_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="p-4">
        <div className="text-[14px] font-semibold text-s-ink md:text-[15px]">{sibling.name}</div>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-s-ink-3">
          <Star size={11} fill="#F3A864" stroke="none" />
          <span>
            {sibling.average_rating?.toFixed(1) ?? "—"}
          </span>
          <span>({sibling.review_count})</span>
        </div>
        <div className="mt-1.5 text-[12px] text-s-ink-3">{sibling.address}</div>
        {category && (
          <div className="mt-1.5 text-[11px] uppercase tracking-[0.04em] text-s-ink-3">
            {capitalize(category)}
          </div>
        )}
      </div>
    </Link>
  );
}
