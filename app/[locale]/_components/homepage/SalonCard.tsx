import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HeartButton } from "./HeartButton";

/**
 * SalonCard — V3 (LIVE_TRUTH §16, V2-D34 lock).
 *
 * Reusable across homepage feeds (Recently Viewed, Last-Minute, Nearby,
 * 4 categories), search results, /favoriten, look-detail sheet salon list,
 * and category pages.
 *
 * Anatomy (§16.1):
 *   ┌──────────────────────┐
 *   │ [curation/discount]♥ │  ← top-left badge + top-right floating heart
 *   │      PHOTO 1:1        │
 *   │ [● availability pill] │  ← bottom-left pill (mutex w curation slot is top-left)
 *   └──────────────────────┘
 *   Salon Name      4.8 ⭐
 *   Service · ab CHF 85
 *
 * Universal color formula (§16.3.0): bg rgba(<hue>, 0.22) + border 0.32 +
 * deep-version-of-hue text + backdrop-filter blur(14px) saturate(1).
 *
 * NOT included in this commit:
 *   - Real `next/image` backed by Supabase Storage CDN — uses `<img>` w/
 *     prop-passed src for now; falls back to category tile if no photo.
 *   - Live availability state derivation from booking data — caller passes
 *     the resolved `availability` prop. Logic lives in API/data layer later.
 *   - Backend save mutation — HeartButton is local state only (Phase 1 wiring).
 *   - Skeleton loader (§16.7) — separate SalonCardSkeleton component (later).
 */

const cardCategoryColors = {
  // V3 4-cat colorways from LIVE_TRUTH §2 (V2-D15-3 lock).
  coiffeur: { bg: "#FFF1DD", initial: "#B5345A" }, // combo Z (cream + cherry)
  barbershop: { bg: "#D8D6CB", initial: "#1A1209" }, // combo G (bone + black)
  nails: { bg: "#CAE8FF", initial: "#B5345A" }, // combo A (pale ice blue + magenta)
  spa: { bg: "#193120", initial: "#D9C9A8" }, // combo I (forest + sandy beige)
} as const;

type Category = keyof typeof cardCategoryColors;

/** Curation badge variants — §16.3.1 */
const curationVariants = cva(
  cn(
    "absolute left-2 top-2 z-[2] inline-flex items-center rounded-lg",
    "px-[10px] py-[5px] font-body text-[10px] font-bold uppercase",
    "leading-[1.2] tracking-[0.02em]",
    "shadow-[0_1px_3px_rgba(26,18,9,0.06)]",
    // backdrop-filter applied via inline style for cross-browser
  ),
  {
    variants: {
      tone: {
        favorit: "text-[#8B5E0F]", // yellow hue + deep amber text
        neutral: "text-s-ink", // white-neutral variant for Top bewertet / Beliebt / Neu
      },
    },
    defaultVariants: { tone: "favorit" },
  },
);

/** Discount badge — §16.3.1b (mutex w curation in same slot) */
const discountClass = cn(
  "absolute left-2 top-2 z-[2] inline-flex items-center rounded-lg",
  "px-[10px] py-[5px] font-body text-[10px] font-bold uppercase",
  "leading-[1.2] tracking-[0.02em] text-[#7A4A14]", // warning-amber deep
  "shadow-[0_1px_3px_rgba(26,18,9,0.06)]",
);

/** Availability pill — §16.3.2 */
const availVariants = cva(
  cn(
    "absolute bottom-2 left-2 z-[2] inline-flex items-center rounded-full",
    "px-[11px] py-[5px] font-body text-[10px] font-bold uppercase",
    "leading-[1.2] tracking-[0.02em]",
    "shadow-[0_1px_3px_rgba(26,18,9,0.06)]",
  ),
  {
    variants: {
      tone: {
        now: "text-[#0E7A38]", // success-green deep
        week: "text-s-brand", // brand-teal
        pause: "text-s-ink-2", // ink-2 deep
      },
    },
    defaultVariants: { tone: "now" },
  },
);

/** Universal glass-tint inline style derived from formula §16.3.0. */
function glassStyle(rgb: string, bgAlpha = 0.22, borderAlpha = 0.32) {
  return {
    background: `rgba(${rgb}, ${bgAlpha})`,
    border: `1px solid rgba(${rgb}, ${borderAlpha})`,
    backdropFilter: "blur(14px) saturate(1)",
    WebkitBackdropFilter: "blur(14px) saturate(1)",
  } as const;
}

/** Brand-teal exception alpha pair per §16.3.0 examples table. */
const tealStyle = glassStyle("4, 51, 56", 0.14, 0.22);
const yellowStyle = glassStyle("242, 193, 68");
const amberStyle = glassStyle("245, 158, 11");
const greenStyle = glassStyle("22, 163, 74");
const inkStyle = glassStyle("122, 105, 87", 0.18, 0.25);
const whiteNeutralStyle = {
  background: "rgba(255, 255, 255, 0.62)",
  border: "1px solid rgba(255, 255, 255, 0.45)",
  backdropFilter: "blur(14px) saturate(1)",
  WebkitBackdropFilter: "blur(14px) saturate(1)",
} as const;

interface CurationProps {
  type: "solen-favorit" | "top-bewertet" | "beliebt" | "neu";
}

function CurationBadge({ type }: CurationProps) {
  const labels = {
    "solen-favorit": "Solen Favorit",
    "top-bewertet": "Top bewertet",
    beliebt: "Beliebt",
    neu: "Neu",
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
      className={discountClass}
      style={amberStyle}
      aria-label={`${percentOff} Prozent Rabatt`}
    >
      −{percentOff}%
    </span>
  );
}

interface AvailabilityProps {
  state: "now" | "week" | "pause";
  label: string;
}

function AvailabilityPill({ state, label }: AvailabilityProps) {
  const styleMap = { now: greenStyle, week: tealStyle, pause: inkStyle };
  return (
    <span
      className={availVariants({ tone: state })}
      style={styleMap[state]}
      aria-label={label}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SalonCard
// ─────────────────────────────────────────────────────────────────────────────

export interface SalonCardProps extends VariantProps<typeof curationVariants> {
  /** Slug for routing → `/salon/[slug]`. */
  slug: string;
  /** Display name. */
  name: string;
  /** 0-5 rating (1 decimal display). `null` shows em-dash. */
  rating: number | null;
  /** Photo URL. If absent, falls back to category-color tile w salon initial. */
  photoUrl?: string;
  /** Photo alt for screen readers — defaults to "Foto von [name]". */
  photoAlt?: string;
  /** Category for fallback tile + heart contrast adjustment (spa = dark bg). */
  category: Category;
  /** Curation badge (top-left) — mutex with `discountPercent`. */
  curation?: CurationProps["type"] | null;
  /** Discount percent (top-left, mutex w curation). */
  discountPercent?: number | null;
  /** Availability pill (bottom-left). `null` hides. */
  availability?: AvailabilityProps | null;
  /** Initial saved state for heart. */
  isSaved?: boolean;
  /** Variant — controls row 2 content shape (§16.5). */
  variant: "availability" | "service";
  /** Variant=availability: row 2 content per §16.5 next-slot logic.
   *  Accepts JSX so consumers can mark bold parts via `<strong>` per
   *  §16.5 typography rule (bold parts = Avant Garde 600 ink-1). */
  availabilityRow?: React.ReactNode;
  /** Variant=service: featured service name. */
  service?: string;
  /** Variant=service: lowest price (CHF) — renders "ab CHF [price]". */
  priceFromCHF?: number | null;
  /** Override card width (rare — defaults to §16.2 spec 160 mobile / 180 tablet+). */
  className?: string;
}

export function SalonCard({
  slug,
  name,
  rating,
  photoUrl,
  photoAlt,
  category,
  curation,
  discountPercent,
  availability,
  isSaved,
  variant,
  availabilityRow,
  service,
  priceFromCHF,
  className,
}: SalonCardProps) {
  const cat = cardCategoryColors[category];
  const isDarkPhoto = category === "spa" && !photoUrl;
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <Link
      href={`/salon/${slug}`}
      aria-label={`${name} — Termin buchen`}
      className={cn(
        "group flex shrink-0 flex-col snap-start",
        "w-[160px] md:w-[180px]",
        "transition-transform duration-200 ease-snap",
        "hover:-translate-y-px",
        "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-[14px]",
        "active:scale-[0.94] active:duration-100",
        className,
      )}
    >
      {/* Photo + overlays */}
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-[14px]",
          // dark spa cat → light heart icon set via [&_.heart-on-dark] etc.
        )}
        style={{ backgroundColor: cat.bg }}
      >
        {/* Photo or category-color initial fallback */}
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={photoAlt ?? `Foto von ${name}`}
            fill
            sizes="(max-width: 768px) 160px, 180px"
            className="object-cover"
          />
        ) : (
          <span
            className="absolute inset-0 grid place-items-center font-body text-[32px] font-black"
            style={{ color: cat.initial }}
            aria-hidden
          >
            {initial}
          </span>
        )}

        {/* Top-left badge slot — curation OR discount, never both */}
        {discountPercent != null ? (
          <DiscountBadge percentOff={discountPercent} />
        ) : curation ? (
          <CurationBadge type={curation} />
        ) : null}

        {/* Bottom-left availability pill */}
        {availability && (
          <AvailabilityPill state={availability.state} label={availability.label} />
        )}

        {/* Top-right floating heart — color overridden in dark-photo variant */}
        <HeartButton
          isSaved={isSaved}
          salonName={name}
          className={isDarkPhoto ? "text-white/85" : undefined}
        />
      </div>

      {/* Text rows under photo */}
      <div className="mt-2 flex flex-col gap-[2px] px-[2px]">
        {/* Row 1 — name + rating */}
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="min-w-0 flex-1 truncate font-body text-[14px] font-bold leading-[1.1] tracking-[-0.01em] text-s-ink"
          >
            {name}
          </h3>
          <span className="flex shrink-0 items-center gap-[2px] font-body text-[11px] font-semibold tabular-nums text-s-ink">
            <Star size={10} fill="#F3A864" stroke="none" aria-hidden />
            {rating != null ? rating.toFixed(1) : "—"}
          </span>
        </div>

        {/* Row 2 — variant content */}
        <div className="font-body text-[11px] leading-[1.3] text-s-ink-2">
          {variant === "availability" ? (
            availabilityRow ?? null
          ) : (
            <>
              {service ?? "—"}
              {priceFromCHF != null && (
                <>
                  {" · ab "}
                  <span className="font-semibold text-s-ink">CHF {priceFromCHF}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
