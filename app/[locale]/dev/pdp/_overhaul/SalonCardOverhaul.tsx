// exists-check: net-new vs app/[locale]/_components/homepage/SalonCard.tsx (real, unmodified,
// the canonical card used across homepage feeds + search + PDP-adjacent surfaces). `npm run
// exists` for "salon card" confirms SalonCard is the single canon , this file is a COPY of it
// with ONE addition (the research spec's exact diff): a `widthClassName` prop that replaces the
// baked-in width classes, because lib/utils.ts `cn()` is plain clsx with no tailwind-merge, so
// passing a wider `className` would NOT reliably override the existing w-[calc(...)] classes
// (both survive, source order decides). A real build should add this same prop to the SHIPPED
// SalonCard.tsx (backward-compatible, all 13 existing callers pass no widthClassName so their
// output is byte-identical) instead of forking , flagged in the page footnote.
// reinvent-ok: CATEGORY_LABEL / cardCategoryColors below are byte-identical copies of the objects
// already declared LOCALLY inside the real SalonCard.tsx (not imported from searchCategories.ts
// there either) , this mockup mirrors that file's own convention, not a new one.

import { Link } from "next-view-transitions";
import { useLocale } from "next-intl";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HeartButton } from "../../../_components/homepage/HeartButton";
import { CardName, CardMeta, RatingStars, PriceFrom } from "../../../_components/primitives";

const cardCategoryColors = {
  coiffeur:   { bg: "#F4F4F5", initial: "#0A0A0A" },
  barbershop: { bg: "#F4F4F5", initial: "#0A0A0A" },
  nails:      { bg: "#F4F4F5", initial: "#0A0A0A" },
  spa:        { bg: "#F4F4F5", initial: "#0A0A0A" },
} as const;

const CATEGORY_LABEL = {
  coiffeur:   "Coiffeur",
  barbershop: "Barbershop",
  nails:      "Nails",
  spa:        "Spa & Wellness",
} as const;

type Category = keyof typeof cardCategoryColors;

const badgeGeometry = cn(
  "absolute left-2 top-2 z-[2] inline-flex items-center gap-1 rounded-[10px]",
  "px-3 py-1.5 font-body text-[12px] font-semibold",
  "leading-[1.2] tracking-[0.01em]",
  "max-md:![backdrop-filter:none] max-md:![-webkit-backdrop-filter:none]",
  "max-w-[calc(100%-56px)]",
);

const discountClass = cn(badgeGeometry, "text-s-love-deep");
const amberStyle = { border: "1px solid rgba(204, 74, 96, 0.22)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;

function layeredGlass(rgb: string, bgAlpha = 0.22, borderAlpha = 0.32) {
  return {
    background: `rgba(${rgb}, ${bgAlpha})`,
    border: `1px solid rgba(${rgb}, ${borderAlpha})`,
    backdropFilter: "blur(14px) saturate(1.1)",
    WebkitBackdropFilter: "blur(14px) saturate(1.1)",
    boxShadow: "0 1px 3px rgba(26, 18, 9, 0.06)",
  } as const;
}

const yellowStyle       = layeredGlass("42, 31, 24",   0.55, 0.85);
const whiteNeutralStyle = layeredGlass("255, 255, 255", 0.50, 0.75);

const curationVariants = cva(
  badgeGeometry,
  {
    variants: {
      tone: {
        favorit: "text-white",
        neutral: "text-s-ink",
      },
    },
    defaultVariants: { tone: "favorit" },
  },
);

interface CurationProps {
  type: "solen-favorit" | "top-bewertet" | "beliebt" | "neu";
}

function CurationBadge({ type }: CurationProps) {
  const labels = {
    "solen-favorit": "Solen favourite",
    "top-bewertet": "Top rated",
    beliebt: "Popular",
    neu: "New",
  };
  const isFavorit = type === "solen-favorit";
  return (
    <span
      className={curationVariants({ tone: isFavorit ? "favorit" : "neutral" })}
      style={isFavorit ? yellowStyle : whiteNeutralStyle}
      aria-label={labels[type]}
    >
      {labels[type]}
    </span>
  );
}

function DiscountBadge({ percentOff }: { percentOff: number }) {
  return (
    <span
      className={cn(discountClass, "bg-s-love-soft")}
      style={amberStyle}
      aria-label={`${percentOff} percent off`}
    >
      -{percentOff}%
    </span>
  );
}

export interface SalonCardOverhaulProps extends VariantProps<typeof curationVariants> {
  slug: string;
  salonId?: string;
  name: string;
  rating: number | null;
  photoUrl?: string;
  photoAlt?: string;
  category: Category;
  curation?: CurationProps["type"] | null;
  discountPercent?: number | null;
  isSaved?: boolean;
  address?: string;
  priceFromCHF?: number | null;
  /** Replaces the default responsive width block , see file header note. */
  widthClassName?: string;
}

/**
 * SalonCardOverhaul , mockup copy of the real homepage SalonCard (ask 6: nearby-rail card
 * grammar matches the homepage card 1:1). Photo 5:4 rounded-[22px] + elevation, discount pill,
 * heart, CardName/CardMeta 3-row hierarchy , identical to the shipped component. The ONLY
 * structural addition is `widthClassName` (ask 5: bigger nearby cards, ~1.25 visible).
 */
export function SalonCardOverhaul({
  slug,
  salonId,
  name,
  rating,
  photoUrl,
  photoAlt,
  category,
  curation,
  discountPercent,
  isSaved,
  address,
  priceFromCHF,
  widthClassName,
}: SalonCardOverhaulProps) {
  const locale = useLocale();
  const cat = cardCategoryColors[category];
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";
  const addressLine = address ?? null;

  return (
    <Link
      href={`/${locale}/salon/${slug}`}
      aria-label={`${name}, book appointment`}
      className={cn(
        "group flex shrink-0 flex-col snap-start",
        widthClassName ?? "w-[calc((100vw-44px)/1.5)] sm:w-[calc((100%-24px)/3)] md:w-[calc((100%-36px)/4)] lg:w-[calc((100%-48px)/5)] xl:w-[calc((100%-60px)/6)]",
        "active:scale-[0.97] active:duration-[80ms] active:ease-glide",
      )}
    >
      <div
        className={cn(
          "relative aspect-[5/4] w-full overflow-hidden rounded-[22px]",
          "shadow-elevation-2",
          "transition-[transform,box-shadow] duration-200 ease-glide",
          "[@media(hover:hover)]:group-hover:-translate-y-[3px] [@media(hover:hover)]:group-hover:scale-[1.015]",
          "[@media(hover:hover)]:group-hover:shadow-elevation-3",
        )}
        style={{
          backgroundColor: cat.bg,
          viewTransitionName: `vt-salon-${slug}`,
        }}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={photoAlt ?? `Photo of ${name}`}
            fill
            sizes="(max-width: 768px) 300px, 300px"
            className="object-cover"
          />
        ) : (
          <span
            className="absolute inset-0 grid place-items-center font-display font-bold leading-none text-[64px] tracking-[-0.03em] md:text-[80px]"
            style={{ color: cat.initial }}
            aria-hidden
          >
            {initial}
          </span>
        )}

        {discountPercent != null && discountPercent > 0 ? (
          <DiscountBadge percentOff={discountPercent} />
        ) : curation ? (
          <CurationBadge type={curation} />
        ) : null}

        <HeartButton isSaved={isSaved} salonId={salonId} salonName={name} />
      </div>

      <div className="mt-2 px-[2px] flex flex-col gap-[2px]">
        <div className="flex items-baseline gap-2">
          <CardName as="h3" className="text-[14px] leading-[1.25] tracking-[-0.01em] truncate min-w-0 flex-1">
            {name}
          </CardName>
          <CardMeta className="shrink-0 text-[13px] tabular-nums">
            {rating != null ? <RatingStars value={rating} size="sm" /> : "-"} {/* psych-ok: byte-identical to the real shipped SalonCard.tsx, CARD_REDESIGN_2026-07-13 C11 owner-approved converged card drops the review count from Row 1 by explicit dated decision */}
          </CardMeta>
        </div>

        <div className="font-body text-[12px] font-normal leading-[1.35] text-s-ink-2 truncate">
          {CATEGORY_LABEL[category]}
        </div>

        {(addressLine || priceFromCHF != null) && (
          <div className="flex items-baseline justify-between gap-2">
            {addressLine && (
              <CardMeta as="span" className="min-w-0 truncate text-[12px] leading-[1.35]">
                {addressLine}
              </CardMeta>
            )}
            {priceFromCHF != null && (
              <CardMeta as="span" className="shrink-0 text-[12px] leading-[1.35]">
                <PriceFrom amount={priceFromCHF} label="from" />
              </CardMeta>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
