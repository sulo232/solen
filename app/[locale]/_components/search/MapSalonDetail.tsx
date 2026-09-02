"use client";

// exists-check: net-new vs lib/utils.ts, lib/salon-hours.ts, lib/active-salon.ts,
// lib/stock-photos.ts, lib/content-flags.ts because none render a single-salon
// map-sheet detail card; `npm run exists MapSalonDetail` returned 0 matches. This
// REUSES SalonResultCard's "feed" visual language AND its exported category/from/
// reviews label constants (CATEGORY_LABEL, FROM_LABEL, REVIEWS_LABEL) rather than
// inventing a new card shape or re-declaring the same lookup data.

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardName, CardMeta, RatingStars, PriceFrom } from "../primitives";
import { HeartButton } from "../homepage/HeartButton";
import { CATEGORY_LABEL, FROM_LABEL, REVIEWS_LABEL, DURATION_UNIT, PHOTO_OF_LABEL } from "./SalonResultCard";
import { withDateParam } from "../salon/_shared";
import type { Salon } from "./SearchTemplate";

/**
 * MapSalonDetail, V3-D453 (2026-07-02, owner-approved /dev/map-behavior mockup).
 *
 * SALON mode content of the mobile map's ONE morphing bottom sheet (SearchTemplate's
 * `mobileView === "map"` overlay). Shown instead of the salon LIST once a pin or list
 * card is tapped (mapSelectedId set). Reuses the SAME visual language as
 * SalonResultCard's `feed` variant (photo, name + star, "distance, address",
 * "category, N reviews", `rounded-xl bg-s-bg-sunken` service rows) rather than
 * inventing a new card shape (a compact thumbnail card was explicitly rejected by
 * the owner). MEDIUM shows the top 3 services; FULL (dragged-up detent) shows all
 * of them. "View store" and every service row link to the PDP.
 *
 * Layer 2 (brand/interaction, the sheet's blue "View store" link + the salon's
 * clickable service rows). Hosts Layer 3 children (HeartButton, star rating).
 *
 * NO FABRICATED DATA: only renders fields the real `salons` API response carries
 * (name, slug, average_rating, cover_photo_url, gallery_urls, address, city,
 * quartier, categories, services, avg_price, review_count, distance_meters). Opening
 * hours / amenities / review snippets shown in the /dev/map-behavior mockup are NOT
 * real fields, so they're intentionally omitted here.
 * TODO(parked): needs hours/amenities data source before an "Open until" line or
 * amenity chips can be added back.
 *
 * All rounded/spacing/color classes below reproduce the owner-approved
 * /dev/map-behavior mockup + SalonResultCard "feed" variant verbatim, mockup-ok.
 */

function formatDistance(m?: number | null): string | null {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// copy-i18n-04 (2026-07-27): was hardcoded German for every locale; now shares
// SalonResultCard's DURATION_UNIT lookup, same reuse pattern as the labels above.
function formatDuration(mins?: number | null, locale: string = "de"): string | null {
  if (!mins || mins <= 0) return null;
  const u = DURATION_UNIT[locale] ?? DURATION_UNIT.de;
  if (mins < 60) return `${mins} ${u.m}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hPart = `${h} ${u.h}`;
  return m === 0 ? hPart : `${hPart} ${m} ${u.m}`;
}

function safeCategory(cats: string[] | undefined): string | null {
  return cats?.[0]?.toLowerCase() ?? null;
}

export interface MapSalonDetailProps {
  /** Selected salon, same shape SearchTemplate's `salons[n]` uses. */
  salon: Salon;
  locale: string;
  /** "All salons" back control, caller clears mapSelectedId (back to LIST mode). */
  onBack: () => void;
  /** false = MEDIUM detent (top 3 services). true = FULL detent (all services). */
  full: boolean;
  isSaved?: boolean;
  /** Back-button copy (searchUi.backToList reused, same "Zurueck zur Liste" i18n key). */
  backLabel: string;
  /** "View store" link copy (searchUi.viewStore). */
  viewStoreLabel: string;
  /** GAP #5 (2026-07-18): the active search's `?date=YYYY-MM-DD`, if any , carried
   *  onto the PDP link the same way SalonResultCard does. */
  date?: string | null;
}

export function MapSalonDetail({
  salon,
  locale,
  onBack,
  full,
  isSaved = false,
  backLabel,
  viewStoreLabel,
  date,
}: MapSalonDetailProps) {
  const href = withDateParam(`/${locale}/salon/${salon.slug}`, date);
  const fromLabel = FROM_LABEL[locale] ?? FROM_LABEL.de;
  const photoOfLabel = PHOTO_OF_LABEL[locale] ?? PHOTO_OF_LABEL.de;
  const catKey = safeCategory(salon.categories);
  const catLabel = catKey ? CATEGORY_LABEL[catKey] ?? catKey : null;

  const cityLine =
    salon.address ||
    (salon.quartier ? salon.quartier.charAt(0).toUpperCase() + salon.quartier.slice(1) : undefined) ||
    salon.city;

  const line1 = [salon.distance_meters != null ? formatDistance(salon.distance_meters) : null, cityLine]
    .filter(Boolean)
    .join(", ");
  const line2 = [
    catLabel,
    salon.review_count != null && salon.review_count > 0
      ? `${salon.review_count} ${REVIEWS_LABEL[locale] ?? REVIEWS_LABEL.de}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  const priced = (salon.services ?? []).filter((s) => s.price != null);
  const visibleRows = full ? priced : priced.slice(0, 3);
  const dotCount = Math.min(salon.gallery_urls?.length ?? 0, 3);

  return (
    <div>
      {/* "All salons" back chip, explicit discoverable path back to LIST mode
          (same result as dragging the sheet down). mockup-ok */}
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1 rounded-full border border-s-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-s-ink transition-transform duration-150 active:scale-95 active:duration-[80ms] active:ease-glide"
      >
        <ChevronLeft size={15} strokeWidth={1.9} aria-hidden /> {backLabel}
      </button>

      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-s-bg-sunken"> {/* mockup-ok: CARD_REDESIGN_2026-07-13 C1, matches SalonCard/SalonResultCard aspect-[5/4] */}
        {salon.cover_photo_url ? (
          <Image
            src={salon.cover_photo_url}
            alt={`${photoOfLabel} ${salon.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 420px" // copy-ok: next/image responsive-sizes attr, not UI copy
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display font-bold leading-none text-[64px] tracking-[-0.03em] text-s-ink-2" aria-hidden>
            {(salon.name ?? "").trim().charAt(0).toUpperCase() || "?"}
          </span>
        )}
        <div className="absolute right-3 top-3 z-10">
          <HeartButton isSaved={isSaved} salonName={salon.name} salonId={salon.id} size={36} iconSize={16} />
        </div>
        {dotCount > 1 && (
          <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
            {Array.from({ length: dotCount }).map((_, i) => (
              <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-white" : "bg-white/55")} />
            ))}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 pt-2.5">
        <CardName as="p" className="truncate font-heading text-[18px] font-bold">
          {salon.name}
        </CardName>
        {salon.average_rating != null && salon.review_count != null && salon.review_count > 0 && (
          <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-s-ink tabular-nums">
            <RatingStars value={salon.average_rating} count={salon.review_count} size="md" />
          </span>
        )}
      </div>
      {line1 && <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{line1}</p>}
      {line2 && <p className="truncate text-[13px] text-s-ink-2">{line2}</p>}
      {salon.avg_price != null && (
        <CardMeta as="p" className="mt-1 text-[13px] leading-[1.35]">
          <PriceFrom amount={salon.avg_price} label={fromLabel} emphasis />
        </CardMeta>
      )}

      {visibleRows.length > 0 && (
        <div className="mt-3 space-y-1.5"> {/* mockup-ok */}
          {visibleRows.map((s) => {
            const svcName = (locale === "en" && s.name_en ? s.name_en : s.name_de) ?? "";
            const dur = formatDuration(s.duration_minutes, locale);
            return (
              <Link
                key={s.id}
                href={href}
                className="flex items-center justify-between gap-3 rounded-xl bg-s-bg-sunken px-3.5 py-2.5 text-[13.5px] active:opacity-80"
              >
                <span className="min-w-0">
                  <span className="block truncate text-s-ink">{svcName}</span>
                  {dur && <span className="text-[12px] text-s-ink-2">{dur}</span>}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-s-ink">{s.price} CHF</span>
              </Link>
            );
          })}
        </div>
      )}

      <Link href={href} className="mt-3 block text-[13.5px] font-semibold text-s-accent">
        {viewStoreLabel}
      </Link>
    </div>
  );
}
