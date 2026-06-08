import Link from "next/link";
import Image from "next/image";
import { Flame, Star } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HeartButton } from "./HeartButton";
import { CardName, CardMeta } from "../primitives";

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
 *   Salon Name      4.8 [star]
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
  // V3-D100 (2026-05-22): tile palette was the 5-stripe Orange identity (cream/
  // navy/orange/yellow paired tiles).
  // CANON sweep (2026-06-01): retired the V2 hues (#142F4A/#E58840/#E9DFC8/
  // #F0C25A) — they're banned per CANON §1. Monogram fallback now mirrors the
  // B&W ink-on-stone pattern from SalonReviews `avatarColor()` (_shared.ts):
  // s-bg-sunken (#F5F5F4) tile + s-ink (#0A0A0A) letter. Same treatment for
  // every category (chrome = no per-category semantic color).
  coiffeur:   { bg: "#F5F5F4", initial: "#0A0A0A" }, // s-bg-sunken + s-ink
  barbershop: { bg: "#F5F5F4", initial: "#0A0A0A" }, // s-bg-sunken + s-ink
  nails:      { bg: "#F5F5F4", initial: "#0A0A0A" }, // s-bg-sunken + s-ink
  spa:        { bg: "#F5F5F4", initial: "#0A0A0A" }, // s-bg-sunken + s-ink
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
  // V3-D175 (2026-05-26): cap width so the badge never overruns the heart
  // (heart sits absolute right-[2px] with a 44px hit area = needs ~48px
  // clearance). 100% - 56px keeps a small visual gap between badge and
  // heart even on the narrow 163px mobile carousel card. Defensive — if a
  // label gets longer later (e.g. "Nur 10 heute"), the truncate inside the
  // span will kick in instead of pushing into the heart's zone.
  "max-w-[calc(100%-56px)]",
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
        // V3-D126 (2026-05-24): text-s-ink-2 (cool grey) → deep green per user
        // "more vibrant" + matches the comment above (V2-D70 spec said green text
        // but the code had grey). Text now hue-matches the bg family.
        // CANON sweep (2026-06-01): #15803D literal → s-success token. `week`
        // also carries bg-s-success-bg now (bg moved off the inline tealStyle).
        now:     "text-s-success",
        week:    "text-s-success bg-s-success-bg",
        urgent:  "text-s-urgency",    // V3-D173: warm-amber burnt-sienna on cream (s-urgency = #C2410C)
        limited: "text-s-urgency",
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
// CANON sweep (2026-06-01): bg #FAD2DA literal removed — love/sale bg now comes
// from the bg-s-love-soft token class on DiscountBadge. Border + shadow stay inline.
const amberStyle    = { border: "1px solid rgba(204, 74, 96, 0.22)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
// CANON sweep (2026-06-01): unused (no call site) — bg #FAD2DA literal removed to
// purge the banned hex. If revived, use bg-s-love-soft via className, not inline bg.
const angebotStyle  = { border: "1px solid rgba(204, 74, 96, 0.22)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
// V2-D71 (2026-05-18): originally dusty-slate blue per Fresha pattern.
// V3-D173 (2026-05-26): swapped to warm-amber per user "make it like
// urgency". Blue read as informational, not urgent. Amber-cream bg +
// burnt-sienna text universally signals "limited / going fast / heat"
// — pairs with the lucide Flame icon for unmissable read.
const urgentStyle   = { background: "#FFF1E6", border: "1px solid rgba(154, 52, 18, 0.22)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
// V3-D126 (2026-05-24): bumped saturation per user "make it abit more vibrant".
// bg #E5F2EA → #D1F0DC (sat ~22% → ~36%, mint reads as actual green now).
// border alpha 0.18 → 0.28 (more visible green ring).
// CANON sweep (2026-06-01): unused (no call site) — bg #D1F0DC literal removed to
// purge the banned hex. If revived, use bg-s-success-bg via className, not inline bg.
const greenStyle    = { border: "1px solid rgba(22, 163, 74, 0.28)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
// CANON sweep (2026-06-01): bg #D1F0DC literal removed — green availability bg
// now comes from the bg-s-success-bg token class on the `week` tone (availVariants).
// Border + shadow stay inline (hue-matched ring, not in token scope).
const tealStyle     = { border: "1px solid rgba(22, 163, 74, 0.28)", boxShadow: "0 1px 3px rgba(26, 28, 25, 0.04)" } as const;
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
      className={cn(discountClass, "bg-s-love-soft")}
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

/** V3-D173 (2026-05-26): retired the hand-drawn corner-SVG arrows per
 *  user "these sh makes no scence like arrows". `state="now"` no longer
 *  renders a glyph (whole "Heute frei" badge is gone — see AvailabilityPill).
 *  `state="urgent"` + `state="limited"` now show lucide Flame — universally
 *  reads "going fast / hot" + harmonizes with the warm-amber pill color. */

function AvailabilityPill({ state, label }: AvailabilityProps) {
  // V3-D173: "now" / "Heute frei" badge entirely retired per user
  // "for heute frei do we even need these badges acc nah remove em".
  // The other state="now" callers (Coiffeur.tsx) also short-circuit on
  // null here without code change at the call site.
  if (state === "now") return null;

  const styleMap = {
    week: tealStyle,
    pause: inkStyle,
    urgent: urgentStyle,
    // V2-D67-fu7: limited shares the urgentStyle. Both are time-pressure
    // semantic → same warm-amber family (V3-D173).
    limited: urgentStyle,
  } as const;
  return (
    <span
      className={availVariants({ tone: state })}
      style={styleMap[state as keyof typeof styleMap]}
      aria-label={label}
    >
      {(state === "urgent" || state === "limited") && (
        <Flame
          size={11}
          strokeWidth={2.25}
          fill="currentColor"
          fillOpacity={0.15}
          aria-hidden
        />
      )}
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
  /** Salon UUID — threaded to HeartButton so the save persists. Omit only for demo cards with no DB row. */
  salonId?: string;
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
  salonId,
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
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-[14px]",
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
          "shadow-elevation-2",
          "transition-[transform,box-shadow] duration-200 ease-glide",
          "group-hover:-translate-y-[3px] group-hover:scale-[1.015]",
          "group-hover:shadow-elevation-3",
        )}
        style={{ backgroundColor: cat.bg }}
      >
        {/* V3-D101 (2026-05-22): stock photos restored per user. Falls back to
            monogram tile when photoUrl is absent. */}
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
            className="absolute inset-0 grid place-items-center font-display font-black leading-none text-[64px] tracking-[-0.03em] md:text-[80px]"
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

        {/* V3-D181 (2026-05-26): AvailabilityPill REMOVED per user
            "remove the badge thing comp its fucking me up". The
            "Nur 1 heute" / "Heute frei" badges were competing for
            attention with the heart, and the urgency framing didn't
            land — too noisy on a small 165px card. `availability` prop
            still accepted by callers (Nearby/Coiffeur still pass it)
            so we don't break the API, but it just doesn't render now.
            If urgency needs to come back, the right place is INSIDE
            Row 3 (next-slot text) as a `Flame` icon prefix on tight
            availability, not as a competing absolute badge. */}

        {/* Top-right floating heart — color overridden in dark-photo variant */}
        <HeartButton
          isSaved={isSaved}
          salonId={salonId}
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
        {/* V3-D174 (2026-05-26): Star + rating MOVED from Row 3 to Row 1
            (Airbnb pattern). Row 1 is now Name | ★ Rating — the most
            important social-proof signal sits where the eye lands first.
            Frees Row 3 to be a clean time-and-price line. */}
        {/* V3-D191 (2026-05-26): name 600→500, rating 600→500, meta/nextslot explicit font-normal,
            nextslot strong stays 600 (max within-body contrast). V3-D190 sizes kept. */}
        <div className="flex items-baseline gap-2">
          {/* V3-D348: name anchor via <CardName> primitive (bakes text-s-ink font-medium). */}
          <CardName as="h3" className="text-[14px] leading-[1.25] tracking-[-0.01em] truncate min-w-0 flex-1">
            {name}
          </CardName>
          {/* V3-D346 (2026-05-28): rating recedes to grey-regular — gold star carries
              the signal; was 500/ink competing with the name. Matches the FeaturedStylists calm-down. */}
          {/* V3-D348: rating meta via <CardMeta> primitive (bakes text-s-ink-2 font-normal). */}
          <CardMeta className="flex shrink-0 items-center gap-[3px] text-[13px] tabular-nums">
            <Star size={11} stroke="none" aria-hidden className="fill-s-star" />
            {rating != null ? rating.toFixed(1) : "—"}
          </CardMeta>
        </div>

        {/* Row 2 — Address · city if available, else category label */}
        <div className="font-body text-[12px] font-normal leading-[1.35] text-s-ink-3 truncate">
          {address ? `${address} · ${city ?? "Basel"}` : CATEGORY_LABEL[category]}
        </div>

        {/* Row 3 — nextSlotLabel · CHF X (rating moved to Row 1 V3-D174) */}
        <div className="font-body text-[12px] font-normal leading-[1.35] text-s-ink-2 truncate">
          {/* V3-D346 (2026-05-28): nextSlot time was font-semibold text-s-ink (600/ink) —
              bolder + darker than the salon name (500). The time was out-shouting the name.
              Dropped to inherit grey-regular so the name is the one anchor. */}
          {nextSlotLabel && (
            <span>{nextSlotLabel}</span>
          )}
          {nextSlotLabel && priceFromCHF != null && <span className="text-s-ink-3">{" · "}</span>}
          {priceFromCHF != null && (
            <span>CHF {priceFromCHF}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
