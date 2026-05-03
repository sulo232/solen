"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

/**
 * SalonMobileCTA — Q53 (locked 2026-05-02) sticky bottom booking entry (mobile).
 *
 * Per Q53, ALL three booking entries (sticky bottom mobile, sticky sidebar
 * desktop, in-flow service+ rows) MUST route to /salon/[slug]/booking
 * (the existing full-page wizard at app/[locale]/salon/[slug]/booking/page.tsx).
 *
 * V5 anti-pattern killed: this component used to open a BottomSheet
 * containing BookingCalendar inline. Q53 explicitly bans bottom-sheet/modal
 * booking ('cramps wizard, breaks URL state'). Now navigates with `<Link>`
 * preserving URL state — back button restores salon detail + scroll position
 * via Next.js scroll restoration.
 *
 * The `selectedServiceId` and `selectedStaffId` query params are forwarded
 * so the wizard can pre-fill formData if user picked a service+ row first.
 */
interface SalonMobileCTAProps {
  salonId: string;
  salonName: string;
  salonSlug: string;
  services: Service[];
  averageRating: number;
  reviewCount: number;
  isOpen: boolean;
  selectedServiceId?: string;
  selectedStaffId?: string;
}

export default function SalonMobileCTA({
  salonName,
  salonSlug,
  services,
  averageRating,
  reviewCount,
  selectedServiceId,
  selectedStaffId,
}: SalonMobileCTAProps) {
  const t = useTranslations("salonDetail") as any;
  const locale = useLocale();

  // Q53: forward pre-selected service/staff to the wizard via search params
  const qs = new URLSearchParams();
  if (selectedServiceId) qs.set("service", selectedServiceId);
  if (selectedStaffId) qs.set("staff", selectedStaffId);
  const bookingHref = `/${locale}/salon/${salonSlug}/booking${qs.toString() ? `?${qs.toString()}` : ""}`;

  const minPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : null;
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";

  return (
    <>
      {/* Mobile sticky booking bar — Q53 navigates, no bottom-sheet trigger */}
      <div
        className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-white border-t border-s-ink/[0.08]"
        style={{
          boxShadow: "0 -4px 20px rgba(26,18,9,0.06)",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            {minPrice !== null && (
              <span className="font-body text-[15px] font-bold text-s-ink tabular-nums">
                ab {formatPrice(minPrice, localeCode)}
              </span>
            )}
            {averageRating > 0 && (
              <span className="flex items-center gap-1 font-body text-[12px] text-s-ink/55">
                <Star className="w-[10px] h-[10px] fill-s-amber text-s-amber" aria-hidden />
                <span className="font-semibold tabular-nums">{averageRating.toFixed(1)}</span>
                <span className="tabular-nums">({reviewCount})</span>
              </span>
            )}
          </div>
          <Link
            href={bookingHref}
            aria-label={t("bookAppointment", { salonName })}
            className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-full bg-s-coral text-white font-body font-bold text-[14px] tracking-[.02em] uppercase transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
          >
            {t("bookNow")}
          </Link>
        </div>
      </div>

      {/* Spacer to prevent sticky CTA from overlapping last section */}
      <div className="lg:hidden pb-[calc(env(safe-area-inset-bottom)+80px)]" aria-hidden="true" />
    </>
  );
}
