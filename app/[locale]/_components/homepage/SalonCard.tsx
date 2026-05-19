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
  // V2-D70 (2026-05-18): updated cat-text colors to align with the warm-minimal
  // brand-green shift (#1A8F5C → #3B7A57). Spa's initial color uses the new
  // brand-mid #2D5E43. Other cats also slightly adjusted to use the new
  // terracotta family (V2-D60 #E0703D → V2-D70 #D87352). Cat bg stays the same
  // tile palette — only the text colors track the brand+accent updates.
  coiffeur:   { bg: "#FFE8D8", initial: "#D87352" }, // peach + V2-D70 terracotta
  barbershop: { bg: "#EAE0D0", initial: "#1A1C19" }, // bone + V2-D70 ink
  nails:      { bg: "#D4DDC8", initial: "#A04A22" }, // sage-pale + terra-deep (kept)
  spa:        { bg: "#E5F2EA", initial: "#2D5E43" }, // V2-D70 brand-subtle + brand-mid
} as const;

/** V2-D60-cards-4 (2026-05-14): display labels for the category subtitle row. */
const CATEGORY_LABEL = {
  coiffeur:   "Coiffeur",
  barbershop: "Barbershop",
  nails:      "Nails",
  spa:        "Spa & Wellness",
} as const;

type Category = keyof typeof cardCategoryColors;

/** Card badge geometry — V2-D63 (2026-05-15).
 *
 * Shared geometry across ALL card badges (discount / availability / curation):
 *  - rounded-[10px] rectangle (NOT a pill — user wanted "long viereck")
 *  - top-left position (single primary-signal slot per card)
 *  - px-3 py-1.5 generous padding for the "long" horizontal feel
 *  - uppercase 10px bold
 *  - text color set per-variant (white on dark/colored glass, ink on white/yellow)
 *
 * The geometry is shared so the system reads as ONE family even though each
 * semantic is a different color. Visual style (glass + tint) comes from the
 * inline `style` attribute via `glassStyle()` — see below. */
const badgeGeometry = cn(
  "absolute left-2 top-2 z-[2] inline-flex items-center gap-1 rounded-[10px]",
  // V2-D67-fu7 (2026-05-16): dropped `uppercase` per user "dont use caps lock
  // like u did on heute frei". Labels render in sentence case as defined by
  // the data (Heute frei, Schnell weg, In 15 Min, etc.). Size bumped 10 → 11px
  // to compensate for lowercase having lower visual weight than uppercase.
  "px-3 py-1.5 font-body text-[11px] font-semibold",
  "leading-[1.2] tracking-[0.01em]",
  // V2-D67-fu12 (2026-05-16) — mobile perf: kill backdrop-filter on phones via
  // arbitrary `!` Tailwind override (inline style on the chip sets it; this
  // unsets it under 768px). iOS Safari was creating ~11 compositor layers per
  // scroll frame from these chips alone, killing smoothness. Desktop unchanged.
  "max-md:![backdrop-filter:none] max-md:![-webkit-backdrop-filter:none]",
);

/** Discount badge — V2-D67-fu10: light pink-red layered glass + red-900 text
 *  (sale semantic, hue-matched text — no brown-on-yellow collision). */
// V2-D70: discount badge text → white (was red-900) to match new solid
// terracotta bg #D87352. White on terracotta = 4.5:1 contrast, AA Large.
// V3-D85-semantic (2026-05-19): text now uses s-love-deep (#A23548) to be
// hue-matched on the new s-love-soft (#FAD2DA) bg per council collapsed-warm
// reduction. Yellow bg is retired — sale collapses into the heart-red family.
const discountClass = cn(badgeGeometry, "text-s-love-deep");

/** Availability pill — V2-D63: MOVED to top-left (was bottom-left).
 *  Same slot as discount + curation, but they're mutex by section logic:
 *  Last-Minute cards have discount (no availability), Nearby cards have
 *  availability (no discount). If both ever co-occur, discount wins. */
const availVariants = cva(
  badgeGeometry,
  {
    variants: {
      tone: {
        // V2-D67-fu10: text matches the bg hue family — green/green, blue/blue,
        // red/red. No more brown-on-yellow.
        // V2-D70/D71 text colors aligned to badge bgs:
        //   now/week  → solid pale mint #E5F2EA + brand-green #3B7A57 text
        //   angebot   → solid terracotta #D87352 + white text
        //   urgent/limited → Dusty Slate #EEF2F6 + navy slate #3A5B7C text (V2-D71)
        //   pause     → ink glass + white text (kept)
        now:     "text-s-ink-2",
        week:    "text-s-ink-2",
        urgent:  "text-[#3A5B7C]",    // V2-D71: deep muted navy on dusty slate
        limited: "text-[#3A5B7C]",
        angebot: "text-s-ink",        // V3-D79: yellow solid → ink text (high contrast on yellow)
        pause:   "text-white",        // ink-2 muted glass (unchanged)
      },
    },
    defaultVariants: { tone: "now" },
  },
);

/** V2-D63 (2026-05-15) — VIBRANT liquid-glass recipe.
 *
 *  Supersedes V2-D61-fu's subtle-tint recipe (alpha 0.28-0.55). User feedback:
 *  "make it more vibrant... make the colors more bright." Bumping alphas to
 *  0.62-0.88 means the color is DOMINANT now, not a hint — but the backdrop
 *  blur + saturate-1.8 preserves the glass refraction (you still see the
 *  photo underneath, just heavily tinted by the badge color).
 *
 *  System tokens — one per semantic. ALL share the same glass treatment
 *  (blur 22px + saturate 1.8 + inset top-edge highlight + outer depth shadow),
 *  only the base color + alpha differ:
 *
 *    discount  · terracotta · sale (% off)
 *    angebot   · yellow     · special offer / package (NEW V2-D63)
 *    urgent    · red        · last call / limited spots (NEW V2-D63)
 *    now       · emerald    · Heute frei
 *    week      · emerald-mid· Diese Woche
 *    pause     · ink-2      · closed / unavailable
 *    favorit   · ink        · Solen Favorit (premium black-glass)
 *    neutral   · white      · Top bewertet / Beliebt / Neu
 */
function glassStyle(rgb: string, bgAlpha = 0.78) {
  return {
    background: `rgba(${rgb}, ${bgAlpha})`,
    backdropFilter: "blur(22px) saturate(1.8)",
    WebkitBackdropFilter: "blur(22px) saturate(1.8)",
    boxShadow:
      "inset 0 1px 0 rgba(255, 255, 255, 0.40), 0 2px 6px rgba(26, 18, 9, 0.18)",
  } as const;
}

/**
 * V2-D67-fu7 (2026-05-16) — layered-glass recipe, restored from V2-D34-fu
 * (commit f965ca0, May 2026) per user "i liked that alot, go check commits".
 *
 * The recipe = tint at 22% alpha + matching 32% alpha border + crisp drop
 * shadow + dark hue-matched text. White-light blur creates the "frosted
 * glass" depth that single-layer tints lack.
 *
 * 3-color palette per semantic category (user: "light green, light yellow,
 * light blue"):
 *   - GREEN family → availability positive (now/week)
 *   - YELLOW family → offer/discount (angebot, DiscountBadge)
 *   - BLUE family → time-pressure (urgent, limited)
 *
 * Dark/muted variants kept intentional: pause (closed/negative), favorit
 * (premium signal), white-neutral (editorial chips).
 */
function layeredGlass(rgb: string, bgAlpha = 0.22, borderAlpha = 0.32) {
  return {
    background: `rgba(${rgb}, ${bgAlpha})`,
    border: `1px solid rgba(${rgb}, ${borderAlpha})`,
    backdropFilter: "blur(14px) saturate(1.1)",
    WebkitBackdropFilter: "blur(14px) saturate(1.1)",
    boxShadow: "0 1px 3px rgba(26, 18, 9, 0.06)",
  } as const;
}

// V2-D70 (2026-05-18) — Aurex/Fresha warm-minimal badge palette:
// Heute frei + Diese Woche → SOLID pale mint #E5F2EA bg + brand-green #3B7A57 text.
// Angebot + Discount → SOLID terracotta #D87352 bg + white text.
// Urgent (Schnell weg / Limited) → stays light-blue layered glass (V2-D67-fu7
// recipe, semantically distinct time-pressure signal — kept blue family).
// V2-D67-fu10 history kept for reference: discount swapped OFF yellow per
// user "brown n yellow doesnt make scence" — V2-D70 takes this further by
// going to solid terracotta (brand-aligned + high contrast white text).
// V3-D85-semantic (2026-05-19): yellow #FFC32B retired from chips — reserved
// only for star ratings + logo dot now. Discount + Angebot collapse into the
// s-love warm-red family (#FAD2DA bg + s-love-deep text via discountClass) so
// they share a semantic family with heart-saved per Airbnb collapsed-warm
// pattern. Council-validated 5→4 color reduction.
const amberStyle    = { background: "#FAD2DA", border: "1px solid rgba(204, 74, 96, 0.22)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
const angebotStyle  = { background: "#FAD2DA", border: "1px solid rgba(204, 74, 96, 0.22)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
// V2-D71 (2026-05-18): swapped from light-bright system-blue glass to "Dusty Slate"
// per user spec — `#EEF2F6` bg + `#3A5B7C` text. Still registers as "blue/different"
// vs the green Heute frei badge, but feels expensive (Fresha/Airbnb pattern) and
// harmonizes with the warm-grey substrate instead of competing with it.
const urgentStyle   = { background: "#EEF2F6", border: "1px solid rgba(58, 91, 124, 0.18)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
const greenStyle    = { background: "#E5F2EA", border: "1px solid rgba(59, 122, 87, 0.18)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
const tealStyle     = { background: "#E5F2EA", border: "1px solid rgba(59, 122, 87, 0.18)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
// V2-D67-fu11 (2026-05-16): unified ALL badges on the layeredGlass formula
// (was mixed — action badges layered, but favorit/pause/curation still on the
// older single-layer glassStyle). Now every badge has consistent border + shadow.
//   favorit  → dark ink layered (premium signal — high alpha keeps it punchy)
//   pause    → muted ink-2 layered (negative state, slightly lower alpha)
//   neutral  → white layered (editorial — Top bewertet / Beliebt / Neu)
const yellowStyle       = layeredGlass("42, 31, 24",   0.55, 0.85); // dark ink — Solen Favorit (premium)
const inkStyle          = layeredGlass("122, 105, 87", 0.40, 0.60); // muted ink-2 — Pause/unavailable
const whiteNeutralStyle = layeredGlass("255, 255, 255", 0.50, 0.75); // white — Top bewertet / Beliebt / Neu

/** Curation badge variants — V2-D63: now uses shared badgeGeometry. */
const curationVariants = cva(
  badgeGeometry,
  {
    variants: {
      tone: {
        favorit: "text-white",  // ink-tint glass + white text (premium feel)
        neutral: "text-s-ink",  // white glass — dark text still reads
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
  /** Now: emerald, "Heute frei" (positive direction ↗).
   *  Urgent: terracotta, "Schnell weg" (filling fast ↘).
   *  Limited: ink, "Nur 2h" (time-pressure ⚡).
   *  Week: emerald-mid, "Diese Woche" (no arrow — no urgency).
   *  Pause: ink-2, closed (no arrow — neutral state). */
  state: "now" | "week" | "pause" | "urgent" | "limited";
  label: string;
}

/** Directional arrow per state — V2-D66 (2026-05-16, Hayden move #16).
 *  Encodes meaning faster than text alone. NOW gets ↗ (positive go-for-it),
 *  URGENT gets ↘ (filling fast, hurry direction), LIMITED gets ⚡ (time
 *  pressure, non-directional but high-energy). Other states render without
 *  an arrow — overuse would make the arrows lose meaning. */
function ArrowGlyph({ state }: { state: AvailabilityProps["state"] }) {
  const props = {
    width: 10,
    height: 10,
    viewBox: "0 0 12 12",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (state === "now") {
    return (
      <svg {...props}>
        <path d="M3 9 L 9 3" />
        <path d="M5 3 L 9 3 L 9 7" />
      </svg>
    );
  }
  if (state === "urgent") {
    return (
      <svg {...props}>
        <path d="M3 3 L 9 9" />
        <path d="M5 9 L 9 9 L 9 5" />
      </svg>
    );
  }
  if (state === "limited") {
    return (
      <svg {...props}>
        <path d="M6 1 L 3 7 L 6 7 L 4 11 L 9 5 L 6 5 Z" />
      </svg>
    );
  }
  return null;
}

function AvailabilityPill({ state, label }: AvailabilityProps) {
  const styleMap = {
    now: greenStyle,
    week: tealStyle,
    pause: inkStyle,
    urgent: urgentStyle,
    // V2-D67-fu7: limited NOW shares the light-blue urgentStyle (was dark ink
    // yellowStyle pre-fu7). Both are time-pressure semantic → same color family.
    limited: urgentStyle,
  } as const;
  return (
    <span
      className={availVariants({ tone: state })}
      style={styleMap[state]}
      aria-label={label}
    >
      <ArrowGlyph state={state} />
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
  /** Category for fallback tile colorway. V2-D48: all 4 cats now light-bg
   *  (Earthen Wellness Light), so the spa-dark-photo heart override is
   *  vestigial — kept as a no-op until a future dark-photo case (e.g. real
   *  salon photo with dark composition) re-introduces the need. */
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
  /** V2-D60-cards-7: pre-formatted next-slot label (e.g. "Heute 14:30", "Morgen 09:00",
   *  "Do. 14:00", "21. Mai 14:00"). Renders in Row 3 alongside priceFromCHF. */
  nextSlotLabel?: string;
  /** V2-D60-cards-8: street address (Fresha-style Row 2 meta). When present, replaces
   *  the category label in Row 2. e.g. "Steinenvorstadt 12" */
  address?: string;
  /** V2-D60-cards-8: city for Row 2 meta line. Defaults to "Basel" if not set. */
  city?: string;
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
  nextSlotLabel,
  address,
  city,
  className,
}: SalonCardProps) {
  const cat = cardCategoryColors[category];
  // V2-D48: spa cat flipped to light moss-pale bg, so this is false for all cats.
  // Kept for forward-compat when real salon photos may have dark composition.
  const isDarkPhoto = false;
  // V2-D67-fu13 (2026-05-16): defensive guard. Was `name.trim()` which crashed
  // the whole homepage when a stale localStorage RecentlyViewed entry lacked
  // a name field (TypeError: Cannot read properties of undefined). Now a
  // missing/empty name falls back to "?" placeholder initial instead of taking
  // down the page.
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";

  return (
    <Link
      href={`/salon/${slug}`}
      aria-label={`${name}, Termin buchen`}
      className={cn(
        "group flex shrink-0 flex-col snap-start",
        // V2-D60-cards-3 (2026-05-14): Airbnb-style RESPONSIVE widths.
        // Cards stretch to fill row at each breakpoint; card count changes:
        //   mobile: viewport-relative — always 2 FULL cards + ~20% peek of the 3rd.
        //          Formula: (100vw - 44px) / 2.2 → at 375 viewport ≈ 150px card,
        //          at 414 viewport ≈ 168px. The "−44" accounts for section/frame
        //          horizontal padding chrome; "/2.2" gives 2 cards + 0.2 peek.
        //   sm 640+ : 3 cards · md 768+ : 4 · lg 1024+ : 5 · xl 1280+: 6
        // No 2xl breakpoint — Section is capped at max-w-[1280px], so wider
        // viewports keep the 6-card layout instead of shrinking cards to fit 7.
        // Formula per breakpoint: card-width = (100% - (N-1)*12gap) / N
        "w-[calc((100vw-44px)/2.2)]",
        "sm:w-[calc((100%-24px)/3)]",
        "md:w-[calc((100%-36px)/4)]",
        "lg:w-[calc((100%-48px)/5)]",
        "xl:w-[calc((100%-60px)/6)]",
        "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-[14px]",
        // V2-D43 (Emil polish): scale(0.94) → scale(0.97) per Emil's subtle range
        // (0.95-0.98). 0.94 felt too jumpy for content cards.
        "active:scale-[0.97] active:duration-[80ms] active:ease-glide",
        className,
      )}
    >
      {/* Photo + overlays. Softer hover (-3px lift / 1.015 scale) + layered
          shadow that doesn't stomp the frosted text pill below.
          V2-D43 (Emil polish): 300ms ease-snap → 200ms ease-glide.
          Hovers should be ≤200ms; ease-glide is the strong-ease-out curve
          that matches Emil's cubic-bezier(0.23, 1, 0.32, 1) recommendation. */}
      <div
        className={cn(
          // V2-D60-cards-6 (2026-05-14): aspect-[6/5] landscape → aspect-square (1:1)
          // to make whole-card "noticeably portrait" matching Airbnb. With ~85px of
          // text below, mobile card lands at ~160×245 = 0.65 ratio (between 5:7 and
          // 7:10 portrait), desktop ~195×280 = 0.70 (~5:7). More portrait than 4:5
          // which felt subtle.
          "relative aspect-square w-full overflow-hidden rounded-[22px]",
          // V3-D72 (2026-05-18) — refined Aurex floating shadow per user spec
          // `0px 6px 24px rgba(0, 0, 0, 0.06)` + `border: none`. Tighter Y
          // offset (10 → 6) keeps shadow closer to card (less "hovering on a
          // stick"), slightly more alpha (0.05 → 0.06) for crisper edge against
          // the new cooler grey substrate #F4F4F6. Pairs with the substrate
          // shift — cooler grey + slightly-stronger shadow = pure-white cards
          // pop more decisively.
          "shadow-[0_20px_40px_rgba(0,0,0,0.04)]",
          "transition-[transform,box-shadow] duration-200 ease-glide",
          "group-hover:-translate-y-[3px] group-hover:scale-[1.015]",
          "group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)]",
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

      {/* V2-D60-cards-7 (2026-05-14): Unified 3-row hierarchy across ALL sections.
          Row 1: Name · Row 2: Category label · Row 3: nextSlotLabel · ab CHF X + ★ rating
          Variant prop kept for backward compat but no longer drives Row 3 content —
          all cards render the same time-and-price format. Time format hint:
          "Heute 14:30" today · "Morgen 09:00" tomorrow · "Do. 14:00" weekday · "21. Mai 14:00" later. */}
      <div className="mt-[10px] px-[2px] flex flex-col gap-[2px]">
        {/* Row 1 — Name only, full width, truncates */}
        <h3 className="font-body text-[15px] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink truncate">
          {name}
        </h3>

        {/* Row 2 — Address · city if available, else category label */}
        <div className="font-body text-[13px] leading-[1.35] text-s-ink-3 truncate">
          {address ? `${address} · ${city ?? "Basel"}` : CATEGORY_LABEL[category]}
        </div>

        {/* Row 3 — nextSlotLabel · CHF X (left) + rating (right-aligned) */}
        <div className="flex items-baseline justify-between gap-2 font-body text-[13px] leading-[1.35] text-s-ink-2">
          <div className="min-w-0 flex-1 truncate">
            {nextSlotLabel && (
              <span className="font-semibold text-s-ink">{nextSlotLabel}</span>
            )}
            {nextSlotLabel && priceFromCHF != null && <span className="text-s-ink-3">{" · "}</span>}
            {priceFromCHF != null && (
              <span>CHF {priceFromCHF}</span>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-[3px] font-semibold tabular-nums text-s-ink">
            <Star size={11} fill="#FFC32B" stroke="none" aria-hidden />
            {rating != null ? rating.toFixed(1) : "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
