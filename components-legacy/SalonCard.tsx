"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Star, MapPin, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal, Scissors,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getNeighborhood, formatQuartier } from "@/lib/basel-neighborhoods";
import type { SalonCard as SalonCardType } from "@/lib/types";
import SalonBadge from "@/components-legacy/ui/SalonBadge";
import ImageFallback from "@/components-legacy/ui/ImageFallback";
import { nameForLocale } from "@/lib/min-price-service";

const BLUR_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOCA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4=";

const BADGE_ICONS: Record<string, LucideIcon> = {
  Star, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal,
};

/* ── DESIGN_SPEC §5.3: No card entrance animations — content just appears ── */

interface SalonCardProps {
  salon: SalonCardType;
  variant?: "default" | "compact";
  locale?: string;
  showAvailability?: boolean;
  showDistance?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: (salonId: string) => void;
  stampProgress?: { current: number; total: number } | null;
  solenTier?: "gold" | "coral" | "grey" | "dark" | null;
  availableToday?: number | null;
  availability?: {
    status: "available" | "unavailable" | "unknown";
    slotsToday?: number;
    nextDate?: string;
  };
  offPeakToday?: { discount_percent: number } | null;
  aiReason?: string;
  onQuickPreview?: () => void;
  animated?: boolean;
  photos?: string[];
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  coiffeur: Scissors,
  hair: Scissors,
  barber: Scissors,
  barbershop: Scissors,
  nails: Gem,
  spa: Sparkles,
  massage: Sparkles,
};

const CAT_COLOURS: Record<string, { bg: string; text: string }> = {
  coiffeur:   { bg: "rgba(243,168,100,.12)",  text: "#7A4A00" },
  barbershop: { bg: "rgba(74,30,60,.12)",    text: "#4A1E3C" },
  nails:      { bg: "rgba(27, 77, 27,.12)",   text: "#7A2415" },
  spa:        { bg: "rgba(123,166,136,.15)", text: "#2A5438" },
};

const CATEGORY_FALLBACK_GRADIENTS: Record<string, [string, string]> = {
  coiffeur:   ["rgba(243,168,100,0.10)",  "rgba(255,255,255,0.98)"],
  barbershop: ["rgba(74,30,60,0.08)",    "rgba(255,255,255,0.98)"],
  nails:      ["rgba(27, 77, 27,0.10)",   "rgba(255,255,255,0.98)"],
  spa:        ["rgba(123,166,136,0.14)", "rgba(255,255,255,0.98)"],
};

function getCategoryFallbackGradient(categories?: string[]): string {
  const cat = (categories?.[0] ?? "coiffeur").toLowerCase();
  const [from, to] = CATEGORY_FALLBACK_GRADIENTS[cat] ?? CATEGORY_FALLBACK_GRADIENTS.coiffeur;
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}


export default function SalonCard({ salon, variant = "default", locale = "de", showAvailability, showDistance, isFavorited, onFavoriteToggle, stampProgress, solenTier, availableToday, availability, offPeakToday, aiReason, photos }: SalonCardProps) {
  const t = useTranslations("salon") as any;
  const tCommon = useTranslations("common");
  const tEmpty = useTranslations("emptyStates");
  const router = useRouter();
  const prefetched = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const href = `/${locale}/salon/${salon.slug}`;
  const [heartBouncing, setHeartBouncing] = useState(false);
  const prevFavorited = useRef(isFavorited);
  useEffect(() => {
    if (isFavorited && !prevFavorited.current) {
      setHeartBouncing(true);
      const timer = setTimeout(() => setHeartBouncing(false), 500);
      return () => clearTimeout(timer);
    }
    prevFavorited.current = isFavorited;
  }, [isFavorited]);

  const [photoIndex, setPhotoIndex] = useState(0);
  const allPhotos = [salon.cover_photo_url, ...(salon.gallery_urls || []), ...(photos || [])].filter(Boolean) as string[];
  const hasMultiple = allPhotos.length > 1;
  const priceToShow = salon.min_price ?? salon.avg_price;

  /* ── Compact variant ─────────────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 p-3 rounded-card bg-white border border-s-border group"
      >
        {/* A3 LOCKED 2026-05-03: photos killed pre-launch, solid category color + Anton name only.
            SUPERSEDED 2026-07-26 for the default-variant cover below (owner approval of the
            saloncard-before-after mockup, FLOORS LAW 2 outranks the 2026-05-03 lock per the
            precedence chain). This compact variant (dashboard settings preview only, not a
            customer-facing surface) keeps the solid-color cover unchanged, out of scope for
            that pass, so ImageFallback is still correct here. */}
        <div className="relative w-16 h-16 rounded-input overflow-hidden shrink-0">
          <ImageFallback category={salon.categories?.[0]} salonName={salon.name} className="absolute inset-0" />
        </div>
        <div className="min-w-0">
          {/* Q26 uppercase caps removed 2026-07-26: no-caps gate (project CLAUDE.md taste rule #10) */}
          <p className="font-heading text-sm text-s-ink truncate leading-[1.05]" style={{ letterSpacing: "0.01em" }}>{salon.name}</p>
          <p className="text-xs text-s-ink-2 font-body truncate">{salon.address}</p>
          {(salon.average_rating > 0 || salon.review_count > 0) ? (
            <div className="flex items-center gap-1 mt-0.5">
              {/* Q43 + SOLEN_UI #5b: stars are amber, NOT coral */}
              <Star className="w-3 h-3 fill-s-star text-s-star" aria-hidden />
              <span className="text-xs text-s-ink-2 tabular-nums">{salon.average_rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-body font-medium text-s-ink bg-s-bg-sunken px-1.5 py-0.5 rounded-pill">{t("new")}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  /* ── Default variant — V4 Clean Card ─────────────────────────────── */
  return (
    <div
      className={`relative card-listing cursor-pointer group ${solenTier === "gold" ? "ring-2 ring-s-yellow/50" : ""}`}
      onMouseEnter={() => { if (!prefetched.current) { prefetched.current = true; router.prefetch(href); } }}
    >
      {/* Date-based availability overlay */}
      {availability?.status === "unavailable" && (
        <div className="absolute inset-0 bg-white/60 rounded-[inherit] z-10 pointer-events-none flex items-end p-3">
          <span className="text-xs font-body text-[s-ink/60] pointer-events-auto">
            {availability.nextDate
              ? t("nextAvailable", { date: new Date(availability.nextDate).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }) })
              : t("noAvailability")}
          </span>
        </div>
      )}
      {availability?.status === "available" && (
        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-pill bg-s-success/90 text-white text-[12px] font-medium font-body">
          {t("availableToday")}
        </span>
      )}

      <Link href={href} className="block w-full h-full">
        {/* Cover, A3 LOCKED 2026-05-03: photos killed pre-launch. Always render
            solid category color, salon name label (locked card pattern,
            ref public/solen-coral.html:225-245, 847-865). Photo carousel state
            (allPhotos/photoIndex/scrollContainerRef) intentionally left orphan
            in case we restore opt-in photo support later.
            SUPERSEDED 2026-07-26 (owner approval of the saloncard-before-after mockup,
            _design-system/captures/principles/saloncard-before-after/index.html; this A3 lock
            and FLOORS LAW 2 (2026-07-21, roughly >= 1/3 photographic area per browse viewport)
            directly contradicted each other on this exact slot, and the later, later-approved
            decision wins per the CLAUDE.md precedence chain): photos are ON. allPhotos (built
            above from cover_photo_url + gallery_urls + the photos prop, previously built and
            then ignored) now renders here, which is why the carousel state was left in place.
            The 8/28 salons with no cover_photo_url get the LOCKFILE-specified fallback, sunken
            bg + category icon + initial, never a bare grey box and never the old 47px placeholder
            again. See _design-system/TASTE_LOG.md 2026-07-26 for the full record. */}
        {/* mockup-ok: CARD_REDESIGN_2026-07-13 (C1, approved card-redesign.html #c11): aspect-square -> aspect-[5/4] */}
        <div className="relative w-full aspect-[5/4] overflow-hidden rounded-[16px] gpu">
          {allPhotos.length > 0 ? (
            <Image
              src={allPhotos[photoIndex] ?? allPhotos[0]}
              alt={salon.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-s-bg-sunken">
              {(() => {
                const CategoryIcon = CATEGORY_ICONS[(salon.categories?.[0] ?? "").toLowerCase()] ?? Scissors;
                return <CategoryIcon className="w-8 h-8 text-s-ink-2" strokeWidth={1.5} aria-hidden />;
              })()}
              {salon.name?.trim()?.[0] && (
                <span className="font-heading text-s-ink-2 text-[15px]" aria-hidden>
                  {salon.name.trim()[0]}
                </span>
              )}
            </div>
          )}

          {/* Phase 2.1 — Priority badge system via SalonBadge */}
          <div className="absolute top-2 left-2 z-[2]">
            <SalonBadge
              salon={salon}
              availabilityStatus={availability?.status}
            />
          </div>

          {/* Category pills on photo — glass style kept here only if no badge? Let's just remove them as they clutter the image in Airbnb style. */}


          {/* Favorite bookmark — Airbnb style */}
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(salon.id); }}
              className="absolute top-1 right-1 z-10 p-2 hover:bg-s-bg-sunken active:scale-[0.92] transition-[transform,background-color] duration-150 rounded-full flex items-center justify-center"
              aria-pressed={isFavorited}
              aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              <motion.div
                animate={heartBouncing ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={heartBouncing ? { type: "spring", stiffness: 400, damping: 15, duration: 0.4 } : { duration: 0 }}
              >
                {/* Heart save state uses --heart-active #FF3366 (HeartButton canon, V3-D103) */}
                <Heart
                  className={`w-[26px] h-[26px] transition-colors duration-200 ${
                    isFavorited ? "" : "fill-transparent stroke-white hover:fill-white/20"
                  }`}
                  strokeWidth={2}
                  style={{
                    filter: "drop-shadow(0 1px 2px rgba(26,18,9,0.45))",
                    ...(isFavorited ? { fill: "#FF3366", color: "#FF3366" } : {}),
                  }}
                />
              </motion.div>
            </button>
          )}

          {/* last_minute_discount badge is now handled by SalonBadge (Phase 2.1) */}

          {/* Availability badge */}
          {showAvailability && salon.next_available_slot && (
            <div className="absolute right-2" style={{ top: onFavoriteToggle ? (salon.last_minute_discount_percent > 0 ? "5rem" : "3rem") : (salon.last_minute_discount_percent > 0 ? "2rem" : "0.5rem") }}>
              <span className="px-2 py-0.5 rounded-pill bg-s-success text-white text-[12px] font-body font-medium">
                {t("availableToday")}
              </span>
            </div>
          )}

          {/* Photo carousel dot indicators — always visible, larger touch target */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10 opacity-100 group-hover/carousel:opacity-100 transition-opacity duration-200">
              {allPhotos.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation();
                    scrollContainerRef.current?.scrollTo({ left: i * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
                  }}
                  className={`rounded-full transition-[background-color,width,height] duration-200 ${i === photoIndex ? "w-2.5 h-2.5 bg-white" : "w-2 h-2 bg-white/60 hover:bg-white/90"}`}
                  aria-label={`Photo ${i + 1} of ${allPhotos.length}`}
                />
              ))}
            </div>
          )}

          {/* Left/right arrows — desktop hover only, larger touch target */}
          {hasMultiple && photoIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation();
                scrollContainerRef.current?.scrollTo({ left: (photoIndex - 1) * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-[opacity,transform,background-color] duration-150 z-[2] hover:bg-white active:scale-[0.92]"
              aria-label="Previous photo"
            >
              <ChevronLeft size={18} strokeWidth={1.9} />
            </button>
          )}
          {hasMultiple && photoIndex < Math.min(allPhotos.length - 1, 4) && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation();
                scrollContainerRef.current?.scrollTo({ left: (photoIndex + 1) * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-[opacity,transform,background-color] duration-150 z-[2] hover:bg-white active:scale-[0.92]"
              aria-label="Next photo"
            >
              <ChevronRight size={18} strokeWidth={1.9} />
            </button>
          )}
        </div>

        {/* ── Info Section — Roadmap 02 Typography Matrix ─────────────────────── */}
        {/* DESIGN_SPEC §3.1: content padding 14px 16px 16px, gap 4px */}
        <div className="flex flex-col gap-1" style={{ padding: "14px 16px 16px" }}>
          {/* Line 1: Name + Rating (right-aligned, Airbnb pattern). Q26 caps removed 2026-07-26
              (no-caps gate, project CLAUDE.md taste rule #10) */}
          {/* mockup-ok: saloncard-before-after/index.html, owner-approved 2026-07-26 */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-s-ink text-[15px] leading-[1.1] truncate">
              {salon.name}
            </h3>
            {salon.average_rating > 0 ? (
              /* Q43 + SOLEN_UI #5b: stars are amber `#F3A864`, NOT coral. Tabular numerics on rating + count. */
              <span className="shrink-0 flex items-center gap-0.5 text-sm font-semibold text-s-ink leading-6">
                <Star className="w-3.5 h-3.5 fill-s-star text-s-star mb-0.5" aria-hidden />
                <span className="tabular-nums">{salon.average_rating.toFixed(1)}</span>
                <span className="text-s-ink-2 font-normal text-xs tabular-nums">({salon.review_count})</span>
              </span>
            ) : salon.review_count === 0 ? (
              <span className="shrink-0 text-xs font-heading text-white bg-s-ink px-2 py-0.5 rounded-pill uppercase tracking-[.06em]">
                {t("new")}
              </span>
            ) : null}
          </div>

          {/* Line 2: Business type · Quartier */}
          <p className="text-sm text-s-ink-2 leading-5 truncate">
            {showDistance && salon.distance_km != null
              ? `${salon.quartier ? formatQuartier(salon.quartier) : getNeighborhood(salon.postal_code)} ${salon.distance_km.toFixed(1)} km`
              : `${((c: string) => c.charAt(0).toUpperCase() + c.slice(1))(salon.categories?.[0] || "Store")} ${salon.quartier ? formatQuartier(salon.quartier) : getNeighborhood(salon.postal_code)}`}
          </p>

          {/* Line 3: Price — Q43 tabular numerics + Q43 CHF prefix via formatPrice */}
          {priceToShow != null && (() => {
            const currencyLocale = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
            const money = formatPrice(priceToShow, currencyLocale);
            // The "ab"/"from" WORDING is only used when the concrete offer is named, which is what
            // Art. 13 PBV requires of an advertised minimum price (SECO Wegleitung 2025 p.17).
            // Corrected 2026-08-16: this rendered the from-wording unconditionally, so on
            // /behandlungen, /brand and the profile favourites list it advertised a starting price
            // with nothing attached to it. The modern SalonCard has always had this guard; this
            // legacy one never did, so the surfaces still using it carried the unlawful shape.
            // A bare number is the safe fallback because it claims less, not more.
            const serviceName =
              (salon as { min_price_service_de?: string | null; min_price_service_en?: string | null;
                          min_price_service_fr?: string | null; min_price_service_it?: string | null });
            const named = nameForLocale({
              de: serviceName.min_price_service_de ?? null,
              en: serviceName.min_price_service_en ?? null,
              fr: serviceName.min_price_service_fr ?? null,
              it: serviceName.min_price_service_it ?? null,
            }, locale ?? "de");
            return (
              <p className="text-sm text-s-ink-2 leading-5 tabular-nums">
                {named ? `${named} ${tCommon("fromPrice", { price: money })}` : money}
              </p>
            );
          })()}

          {/* Line 4: Nächster Termin (Phase 3.4) */}
          {salon.next_available_slot && (() => {
            const slot = new Date(salon.next_available_slot);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
            const slotDay = new Date(slot); slotDay.setHours(0, 0, 0, 0);
            const timeStr = slot.toLocaleTimeString(locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH", { hour: "2-digit", minute: "2-digit" });
            let label: string;
            if (slotDay.getTime() === today.getTime()) {
              label = t("nextAppointmentToday", { time: timeStr });
            } else if (slotDay.getTime() === tomorrow.getTime()) {
              label = t("nextAppointmentTomorrow", { time: timeStr });
            } else {
              const dateStr = slot.toLocaleDateString(locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH", { weekday: "short", day: "numeric", month: "short" });
              label = t("nextAppointmentDate", { date: dateStr, time: timeStr });
            }
            return (
              <p className="text-xs font-medium leading-5 text-s-success">
                {label}
              </p>
            );
          })()}

          {/* Line 5: Social proof (Phase 3.5) */}
          {(salon.booking_count_week ?? 0) >= 3 && (
            <p className="text-xs text-s-ink-2 leading-5">
              {t("bookedTimesThisWeek", { count: salon.booking_count_week })}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
