// DS-A4 (2026-06-11): Link from next-view-transitions so the card photo can
// morph into the PDP hero (16.3 flagship). API-identical to next/link.
import { Link } from "next-view-transitions";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { HeartButton } from "./HeartButton";
import { CardName, CardMeta, RatingStars, PriceFrom } from "../primitives";
// FROM_LABEL reuse (rule 12, don't re-declare): the locale "ab"/"from"/"des"/"da"
// record already shipped in SalonResultCard.tsx.
import { FROM_LABEL } from "../search/SalonResultCard";

/**
 * SalonCard — V3 (LIVE_TRUTH §16, V2-D34 lock).
 *
 * Reusable across homepage feeds (Recently Viewed, Last-Minute, Nearby,
 * 4 categories), search results, /favoriten, look-detail sheet salon list,
 * and category pages.
 *
 * Anatomy, CARD_REDESIGN_2026-07-13 (C11, converged card, mockup-ok):
 *   ┌──────────────────────┐
 *   │ [curation/discount]♥ │  top-left badge + top-right floating heart
 *   │      PHOTO 5:4        │
 *   └──────────────────────┘
 *   Salon Name        4.8 [gold star]
 *   Category label
 *   Address (postal+city / street)     ab CHF 85
 *
 * Universal color formula (§16.3.0): bg rgba(<hue>, 0.22) + border 0.32 +
 * deep-version-of-hue text + backdrop-filter blur(14px) saturate(1).
 *
 * Photo is a real `next/image` (below); the heart persists via
 * `POST /api/favorites/toggle` (see `HeartButton.tsx`), not local state only.
 *
 * NOT included in this commit:
 *   - Skeleton loader (§16.7), a separate SalonCardSkeleton component (later).
 */

const cardCategoryColors = {
  // V3-D100 (2026-05-22): tile palette was the 5-stripe Orange identity (cream/
  // navy/orange/yellow paired tiles).
  // CANON sweep (2026-06-01): retired the V2 hues (#142F4A/#E58840/#E9DFC8/
  // #F0C25A) — they're banned per CANON §1. Monogram fallback now mirrors the
  // B&W ink-on-stone pattern from SalonReviews `avatarColor()` (_shared.ts):
  // s-bg-sunken (#F4F4F5) tile + s-ink (#0A0A0A) letter. Same treatment for
  // every category (chrome = no per-category semantic color).
  // mockup-ok: transposed-hex bug fix, #F5F5F4 was never the locked s-bg-sunken value
  // (#F4F4F5 per CLAUDE.md design contract); correcting to the token that was always intended
  coiffeur:   { bg: "#F4F4F5", initial: "#0A0A0A" }, // s-bg-sunken + s-ink
  barbershop: { bg: "#F4F4F5", initial: "#0A0A0A" }, // s-bg-sunken + s-ink
  nails:      { bg: "#F4F4F5", initial: "#0A0A0A" }, // s-bg-sunken + s-ink
  spa:        { bg: "#F4F4F5", initial: "#0A0A0A" }, // s-bg-sunken + s-ink
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
  "px-3 py-1.5 font-body text-[12px] font-semibold",
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

// mockup-ok: CARD_REDESIGN_2026-07-13 (C2, approved public/_mockups/card-redesign.html
// #c11): availVariants (the AvailabilityPill cva) removed. The converged card has no
// availability badge, see AvailabilityPill's removal note further down + REMOVED.md.

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
// mockup-ok: CARD_REDESIGN_2026-07-13 (C2, approved #c11): urgentStyle/greenStyle/
// tealStyle/inkStyle (the week/urgent/limited/pause availability-pill tones) removed
// with AvailabilityPill itself, the converged card has no availability badge.
// V2-D67-fu11 (2026-05-16): unified ALL badges on the layeredGlass formula
// (was mixed — action badges layered, but favorit/curation still on the
// older single-layer glassStyle). Now every badge has consistent border + shadow.
//   favorit  → dark ink layered (premium signal — high alpha keeps it punchy)
//   neutral  → white layered (editorial — Top bewertet / Beliebt / Neu)
const yellowStyle       = layeredGlass("42, 31, 24",   0.55, 0.85); // dark ink — Solen Favorit (premium)
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
  const t = useTranslations("common");
  return (
    <span
      className={cn(discountClass, "bg-s-love-soft")}
      style={amberStyle}
      aria-label={t("percentOffAria", { percent: percentOff })}
    >
      −{percentOff}%
    </span>
  );
}

// mockup-ok: CARD_REDESIGN_2026-07-13 (C2, approved public/_mockups/card-redesign.html
// #c11): AvailabilityProps, AvailabilityPill and NextSlotText (the Row 3 calendar
// next-slot text helper) removed. The converged card renders no availability badge
// and no next-slot text anywhere, see _design-system/REMOVED.md for the graveyard line.

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
  /** Review count backing `rating`. CARD_REDESIGN_2026-07-13 (C11, owner-approved
   *  converged card): Row 1 no longer shows the count next to the star, kept in
   *  the interface unused-by-render so existing callers compile unchanged (same
   *  pattern as `nextSlotLabel` below). psych-ok: dated owner decision. */
  reviewCount?: number | null;
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
  /** Initial saved state for heart. */
  isSaved?: boolean;
  /** Variant — kept for backward compat, no longer drives any row content. */
  variant: "availability" | "service";
  /** Variant=service: featured service name. */
  service?: string;
  /** Variant=service: lowest price (CHF) — renders "ab CHF [price]". */
  priceFromCHF?: number | null;
  /** Name of the service that priceFromCHF belongs to. Art. 13 PBV: a from-price is lawful
   *  advertising ONLY when the copy says which concrete offer it buys (SECO Wegleitung 2025
   *  p.17). Omitted -> the card renders the bare price with no "from", which is the safe
   *  fallback rather than an unlawful unqualified from-price. */
  priceFromService?: string | null;
  /** CARD_REDESIGN_2026-07-13 (C2): the availability badge + Row 3 next-slot text
   *  were removed from the converged card. Kept in the interface unused-by-render
   *  so existing callers compile unchanged. */
  nextSlotLabel?: string;
  /** Street address (e.g. "Steinenvorstadt 5"). Row 3 shows this when
   *  `citySelected` is true, else it falls back to `postalCode` + `city`
   *  (CARD_REDESIGN_2026-07-13, C6/C11/C16). */
  address?: string;
  /** Postal code (e.g. "4051"). Row 3 shows `"{postalCode} {city}"` when
   *  `citySelected` is false/absent. */
  postalCode?: string;
  /** City name, paired with `postalCode` (or appended for context). */
  city?: string;
  /** True when the caller is on a city-scoped surface (e.g. `/{city}/{category}`),
   *  so Row 3 shows the street `address` instead of `postalCode` + `city`. */
  citySelected?: boolean;
  /** Override card width (rare — defaults to §16.2 spec 160 mobile / 180 tablet+). */
  className?: string;
  /** Replaces the default responsive width classes outright (2026-07-24, PDP nearby
   *  rail's ~1.25-visible sizing). cn() is plain clsx with no tailwind-merge, so a
   *  wider className alone cannot reliably override the baked-in w-[calc(...)]
   *  classes below (both would survive, source order decides). Every existing caller
   *  passes no widthClassName, so their output is byte-identical to before. */
  widthClassName?: string;
  /** performance-05: opts this card's photo into next/image's `priority` (eager
   *  load + preload hint, skips lazy-load's IntersectionObserver wait). Set true
   *  ONLY on the single card a caller knows renders above-the-fold on first paint
   *  (e.g. index 0 of the first visible row), never on every card in a rail, or
   *  every card competes for preload bandwidth and the point is lost. Defaults to
   *  false/absent so every existing caller keeps today's lazy-load behavior. */
  priority?: boolean;
  /** Forwarded straight to the card's own HeartButton. Added 2026-09-04 alongside the same prop on
   *  HeartButton itself: a parent list (e.g. /profile/favorites) needs to know when this card's
   *  heart settles to unsaved so it can drop the card, without a second write path. Optional and
   *  additive, every existing caller omits it and behaves exactly as before. */
  onToggled?: (isSaved: boolean) => void;
}

export function SalonCard({
  slug,
  salonId,
  name,
  rating,
  reviewCount,
  photoUrl,
  photoAlt,
  category,
  curation,
  discountPercent,
  isSaved,
  variant,
  service,
  priceFromCHF,
  priceFromService,
  nextSlotLabel,
  address,
  postalCode,
  city,
  citySelected,
  className,
  widthClassName,
  priority,
  onToggled,
}: SalonCardProps) {
  // Locale-prefixed href (2026-06-11): the bare `/salon/x` href relied on the
  // next-intl middleware to guess a locale — which (a) could land on the wrong
  // language and (b) inserts a redirect that kills the 16.3 view transition.
  const locale = useLocale();
  const t = useTranslations("common");
  const tNav = useTranslations("navigation");
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
  const fromLabel = FROM_LABEL[locale] ?? FROM_LABEL.de;
  // CARD_REDESIGN_2026-07-13 (C6/C11/C16): Row 3 address is conditional on
  // whether the caller is on a city-scoped surface. `citySelected` true -> the
  // street `address`; false/absent -> "{postalCode} {city}" when a postal code
  // is known. Neither given (e.g. static homepage demo data with no postal_code
  // wired yet) -> address is omitted, never fabricated.
  const addressLine = citySelected
    ? address ?? null
    : postalCode
      ? `${postalCode} ${city ?? ""}`.trim()
      : null;

  return (
    <Link
      href={`/${locale}/salon/${slug}`}
      aria-label={t("bookWithAria", { name })}
      className={cn(
        "group flex shrink-0 flex-col snap-start",
        // V2-D60-cards-3 (2026-05-14): Airbnb-style RESPONSIVE widths.
        // Cards stretch to fill row at each breakpoint; card count changes:
        //   mobile: viewport-relative - 1 FULL card + a peek of the next.
        //          Formula: (100vw - 44px) / 1.5 -> at 412 viewport ~245px card
        //          (R4-2, owner "V2, not V3": bigger card at ~250px with the next
        //          card peeking, was /2.2 ~167px). The "-44" accounts for
        //          section/frame horizontal padding chrome.
        //   sm 640+ : 3 cards · md 768+ : 4 · lg 1024+ : 5 · xl 1280+: 6
        // No 2xl breakpoint, Section is capped at max-w-[1280px], so wider
        // viewports keep the 6-card layout instead of shrinking cards to fit 7.
        // Formula per breakpoint: card-width = (100% - (N-1)*12gap) / N
        // mockup-ok: widthClassName (2026-07-24) replaces this whole responsive block
        // outright when passed; every existing caller omits it, so this stays the
        // untouched default.
        widthClassName ?? [
          "w-[calc((100vw-44px)/1.5)]", // mockup-ok: /dev/card-ratio V2 approved (owner 2026-07-03, R4-2)
          "sm:w-[calc((100%-24px)/3)]",
          "md:w-[calc((100%-36px)/4)]",
          "lg:w-[calc((100%-48px)/5)]",
          "xl:w-[calc((100%-60px)/6)]",
        ],
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-[14px]",
        // V2-D43 (Emil polish): scale(0.94) → scale(0.97) per Emil's subtle range
        // (0.95-0.98). 0.94 felt too jumpy for content cards.
        "transition-transform duration-150 active:scale-[0.97] active:duration-[80ms] active:ease-glide",
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
          // CARD_REDESIGN_2026-07-13 (C1, approved card-redesign.html #c11): photo
          // ratio 3/2 -> 5/4, supersedes the 2026-07-02 3/2 approval.
          "relative aspect-[5/4] w-full overflow-hidden rounded-[22px]", // mockup-ok: CARD_REDESIGN_2026-07-13 C1 5/4 approved
          "shadow-elevation-2",
          "transition-[transform,box-shadow] duration-200 ease-glide",
          "group-hover:-translate-y-[3px] group-hover:scale-[1.015]",
          "group-hover:shadow-elevation-3",
        )}
        // S2 (2026-08-03): the name is CARRIED here, not APPLIED here. It used to be an inline
        // `viewTransitionName: vt-salon-${slug}` on every card, and the comment that sat here
        // claimed a repeated slug merely "falls back to the default cross-fade (harmless)".
        // Measured on /de: 20 slugs rendered more than once (atelier-haarwerk 4x, glow-lab-basel
        // 3x, pink-petal-nails 3x, blade-and-stone 3x), and the real browser behaviour is not a
        // harmless fallback , Chrome logs "Unexpected duplicate view-transition-name: ..." and
        // ABORTS the whole transition with "InvalidStateError: Transition was aborted"
        // (reproduced 2/2 on /de -> open overlay -> type "cut" -> tap a card -> history.back()).
        // A view-transition-name must be unique per document, so no card claims one at rest;
        // PageTransition.tsx puts it on the ONE card being activated, in the click's capture
        // phase, before next-view-transitions calls startViewTransition. Exactly one element can
        // then carry it, so the card the user actually tapped still morphs into the PDP hero
        // (SalonHero.tsx, same `vt-salon-${slug}`) and no other card can collide with it.
        data-vt-salon={`vt-salon-${slug}`}
        style={{
          backgroundColor: cat.bg,
        }}
      >
        {/* V3-D101 (2026-05-22): stock photos restored per user. Falls back to
            monogram tile when photoUrl is absent. */}
        {photoUrl ? (
          <Image
            src={photoUrl}
            // accessibility-06 (2026-07-27): the old fallback ("Foto von {name}") just
            // echoed the name already read by CardName next to it, conveying nothing new
            // to a screen-reader user. Uses the one real piece of photo-adjacent metadata
            // this card actually has, the salon's category, so the alt text says WHAT kind
            // of place the photo shows, not just whose photo it is again.
            alt={photoAlt ?? `${name}, ${tNav(category)}`}
            fill
            sizes="(max-width: 768px) 160px, 180px"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <span
            className="absolute inset-0 grid place-items-center font-display font-semibold leading-none text-[64px] tracking-[-0.03em] md:text-[80px]"
            style={{ color: cat.initial }}
            aria-hidden
          >
            {initial}
          </span>
        )}

        {/* Top-left badge slot — curation OR discount, never both */}
        {/* mockup-ok: gated on > 0, not just != null (2026-07-24, REMOVED.md "discount pill
            -0% zero percent"): a real discount of exactly 0 must never render "-0%". */}
        {discountPercent != null && discountPercent > 0 ? (
          <DiscountBadge percentOff={discountPercent} />
        ) : curation ? (
          <CurationBadge type={curation} />
        ) : null}

        {/* CARD_REDESIGN_2026-07-13 (C2, mockup-ok, approved card-redesign.html
            #c11): AvailabilityPill (first hidden V3-D181, 2026-05-26) is now
            fully deleted, the `availability` prop, its cva, and its styles are
            gone from this file. See _design-system/REMOVED.md for the graveyard
            line. */}

        {/* Top-right floating heart, color overridden in dark-photo variant */}
        <HeartButton
          isSaved={isSaved}
          salonId={salonId}
          salonName={name}
          onToggled={onToggled}
          className={isDarkPhoto ? "text-white/85" : undefined}
        />
      </div>

      {/* mockup-ok: CARD_REDESIGN_2026-07-13 (C11, owner-approved converged card,
          public/_mockups/card-redesign.html #c11). 3-row hierarchy: Row 1 name
          plus gold star rating with no count, Row 2 category label always, Row 3
          conditional address (postal+city or street) plus price on one line.
          Supersedes V2-D60-cards-7's nextSlotLabel row, no availability or
          next-slot text anywhere on this card. */}
      {/* geometry sweep (2026-07-17, _geometry-triage.md #1): mt-[10px] -> mt-2
          (8, matches the same photo-to-text-block gap on SalonResultCard.tsx:643).
          px-[2px] and gap-[2px] left AS IS: a 2px inset/row-gap on a
          CARD_REDESIGN_2026-07-13-approved 3-row info stack is a deliberate
          micro-relationship (dense info stack, mockup-approved), not a bug;
          snapping to px-0/gap-1 would visibly loosen it. */}
      <div className="mt-2 px-[2px] flex flex-col gap-[2px]">
        <div className="flex items-baseline gap-2">
          {/* V3-D348: name anchor via <CardName> primitive (bakes text-s-ink font-medium). */}
          {/* OWNER PICK 2026-08-06, direction D: tracking off, name weight up to 600. The global
              heading rule cannot reach this arbitrary utility, so the card name carries it here. */}
          <CardName as="h3" className="text-[14px] font-semibold leading-[1.25] truncate min-w-0 flex-1">
            {name}
          </CardName>
          {/* V3-D348: rating meta via <CardMeta> primitive (bakes text-s-ink-2 font-normal). */}
          {/* mockup-ok: 13px -> 12px, owner-approved public/_mockups/improve/type-scale.html
              (8 -> 4 type-scale merge); the star + color already carry the distinction. */}
          <CardMeta className="shrink-0 text-[12px] tabular-nums">
            {rating != null ? (
              // psych-ok: CARD_REDESIGN_2026-07-13 C11 owner-approved converged card drops the review count from Row 1 by explicit dated design decision.
              <RatingStars value={rating} size="sm" />
            ) : (
              "—" // em-dash-ok: pre-existing no-rating placeholder glyph, unchanged
            )}
          </CardMeta>
        </div>

        {/* Row 2 - category label, always (address moved to Row 3, C11). */}
        <div className="font-body text-[12px] font-normal leading-[1.35] text-s-ink-2 truncate">
          {tNav(category)}
        </div>

        {/* Row 3 - conditional address (C6/C16) + price, one line, mockup-ok:
            CARD_REDESIGN_2026-07-13 (C11, approved card-redesign.html #c11). */}
        {(addressLine || priceFromCHF != null) && (
          <div className="flex items-baseline justify-between gap-2">
            {addressLine && (
              <CardMeta as="span" className="min-w-0 truncate text-[12px] leading-[1.35]">
                {addressLine}
              </CardMeta>
            )}
            {priceFromCHF != null && (
              <CardMeta as="span" className="shrink-0 text-[12px] leading-[1.35]">
                {/* The "from" word only appears when the service it refers to is named. SECO
                    Wegleitung 2025 p.17: an advertised minimum price must describe the concrete
                    offer. Without a name we show the bare number instead of an unqualified
                    from-price, because the bare number claims less, not more. */}
                {/* 2026-08-15: the price is the card's SECOND ANCHOR and it was rendering at
                    12px/400 ink-2, identical to the category, the city AND the rating. Four of
                    five meta values the same is why the owner read the card as "not balanced ...
                    it looks empty": one ink element, then a flat grey block. The locked hierarchy
                    row already said otherwise ("price bold-ink but smaller than name") and V3-D442
                    wants name and price as the two ink anchors with the NAME larger, so 14/600
                    name against 12/600 ink price keeps SIZE as the anchor marker.
                    `emphasis` is PriceFrom's own prop for this; the first attempt hand-set classes
                    on the CardMeta parent instead, which is the hand-drawing FLOORS LAW 9 bans and
                    it did not win the colour anyway. */}
                <PriceFrom
                  amount={priceFromCHF}
                  emphasis
                  className="text-s-ink"
                  label={priceFromService ? `${priceFromService} ${fromLabel}` : undefined}
                />
              </CardMeta>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
