"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Store, ArrowRight, Phone, Star } from "lucide-react";

/**
 * EmptyServicesState — booking flow when a salon has 0 bookable services
 * (onboarded but no services yet, or all deactivated). Audit gap #8, built from the
 * approved mockup `public/_mockups/restraint/booking-empty-services.html`.
 *
 * Core of the mockup: a full-page empty state — store icon, headline, a calm explanation,
 * the salon card, and the only real paths forward: view the salon page (one ink commit CTA
 * per CONTROL_ELEVATION C) + call the salon (blue text link, the sparse small-clickable-bit
 * allowance). No fabricated data — rating/reviews/address render only when present.
 *
 * Deliberate deviation from the mockup: the mockup shows a 4-step indicator (Service/Datum/
 * Zeit/Details), but the live BookingWizard is a 3-step indicator with different labels
 * ("Auswahl / Datum & Zeit / …"). A 4-step bar here would misrepresent the real flow, so it
 * is dropped — this is a terminal state, not step 1 of anything reachable.
 */
export default function EmptyServicesState({
  locale,
  slug,
  salonName,
  coverPhotoUrl,
  rating,
  reviewCount,
  address,
  phone,
}: {
  locale: string;
  slug: string;
  salonName: string;
  coverPhotoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
}) {
  const t = useTranslations("booking");

  return (
    <div className="flex min-h-[70vh] flex-col">
      {/* Empty state — centered */}
      <div className="flex flex-1 flex-col items-center justify-center px-1 text-center">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-s-bg-sunken">
          <Store size={34} strokeWidth={1.8} className="text-s-ink-2" aria-hidden />
        </div>
        <h2 className="font-heading text-[24px] font-bold leading-[1.2] tracking-[-0.01em] text-s-ink">
          {t("emptyTitle")}
        </h2>
        <p className="mt-3 max-w-[340px] text-[15px] leading-relaxed text-s-ink-2">{t("emptyBody")}</p>

        {/* Salon card — real data only */}
        <div className="mt-7 w-full max-w-[420px] rounded-card border border-s-border bg-white p-3 shadow-elevation-1">
          <div className="flex items-center gap-3 text-left">
            {coverPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPhotoUrl} alt="" className="h-14 w-14 shrink-0 rounded-[12px] object-cover" />
            ) : (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken font-heading text-lg font-semibold text-s-ink">
                {salonName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-heading text-[16px] font-semibold text-s-ink">{salonName}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
                {rating != null && rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={14} strokeWidth={1.6} className="fill-s-star text-s-star" aria-hidden />
                    <span className="font-semibold tabular-nums text-s-ink">{rating.toFixed(1)}</span>
                    {reviewCount != null && reviewCount > 0 && (
                      <span className="tabular-nums text-s-accent">({reviewCount})</span>
                    )}
                  </span>
                )}
                {address && <span className="truncate text-s-ink-2">{address}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Actions — one ink commit + a blue call link */}
        <Link
          href={`/${locale}/salon/${slug}`}
          className="mt-6 flex h-[52px] w-full max-w-[420px] items-center justify-center gap-2 rounded-btn bg-s-ink text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
        >
          {t("emptyToSalon")}
          <ArrowRight size={17} strokeWidth={1.9} aria-hidden />
        </Link>
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="mt-4 flex items-center justify-center gap-1.5 text-[15px] font-semibold text-s-accent transition-opacity active:opacity-60"
          >
            <Phone size={15} strokeWidth={1.9} aria-hidden />
            {t("emptyCallSalon")}
          </a>
        )}
      </div>
    </div>
  );
}
