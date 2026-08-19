import { Fragment, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Store, MapPin, ArrowRight } from "lucide-react";
import { cn, splitHighlight } from "@/lib/utils";
import { withDateParam } from "../salon/_shared";
import { FROST_GLASS } from "@/lib/frost-glass";
import { CardName, CardMeta, RatingStars, PriceFrom } from "../primitives";
import { HeartButton } from "../homepage/HeartButton";

/**
 * SalonResultCard — V3-D350 (2026-05-28).
 *
 * Clean Airbnb-style card for the category/search results 2-column grid
 * (`/coiffeur` etc., now the DEFAULT render — no flag).
 *
 * STRUCTURE: Airbnb search card (per explicit user direction 2026-05-28 — a
 *   conscious §10.5 divergence from the Fresha-structure default, user-approved):
 *   rounded ~1:1 photo + heart overlay + optional "Beliebt" badge, then below
 *   the name + ★rating inline, a grey meta line, "ab X CHF", and a next-available
 *   slot pill (V3-D371, "booking-intent" card — the hook that makes the category
 *   page read "book today" not "directory"). NO inline service ROWS (the full
 *   service list stays on the salon PDP) — just the single next-slot signal.
 * AESTHETIC: LOCKFILE — rule A13 (the salon NAME is the ONE ink anchor via
 *   <CardName>; rating/meta/price all recede via <CardMeta>). Photo uses
 *   `rounded-card` per the V3-D350 §11 exception (search cards only). Star
 *   #FFC32B. Heart #FF3366 (inside HeartButton).
 *
 * SEPARATE from the homepage `SalonCard` (which stays compact for feeds).
 * Universal (V3-D205): one code path for every category, category is a prop.
 *
 * Graceful with sparse data: renders only what is present (rating, meta bits,
 * price are each conditional).
 */

export interface SalonResultCardProps {
  slug: string;
  name: string;
  locale: string;
  rating?: number | null;
  photoUrl?: string | null;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  distanceMeters?: number | null;
  priceFromCHF?: number | null;
  /** Name of the service priceFromCHF belongs to. Art. 13 PBV: an advertised from-price is
   *  lawful only when the copy names the concrete offer it buys (SECO Wegleitung 2025 p.17).
   *  Absent -> the bare price renders with no "from" word, which claims less, not more. */
  priceFromService?: string | null;
  /** V3-D372: review count shown as "(124)" beside the rating - Fresha's category
   *  list shows "N reviews"; Solen keeps it grey/recessive (A13: name stays the one
   *  ink anchor). Hidden when 0/absent. */
  reviewCount?: number | null;
  isSaved?: boolean;
  salonId?: string;
  /** V3-D357: earliest available slot label ("heute 15:30") - the booking hook +
   *  the content that stops the card reading empty. Computed in SearchTemplate. */
  nextSlot?: string | null;
  /** GAP #5 (2026-07-18): the active search's `?date=YYYY-MM-DD`, if any , carried
   *  onto the PDP link so the booking flow can pre-select it instead of dropping the
   *  context the user already picked. Only a strict YYYY-MM-DD shape is forwarded
   *  (see `withDateParam`); anything else is silently dropped, no crash. */
  date?: string | null;
  /** V3-D376 (2026-05-30): top services + their bookable slots, rendered as the
   *  card's "featured service + time pills + Alle Services" block (user pick "#3").
   *  Supersedes the V3-D371 no-service-rows decision. From ?with_slots=1. */
  services?: {
    id: string;
    name_de?: string | null;
    name_en?: string | null;
    price?: number | null;
    duration_minutes?: number | null;
    slots?: string[] | null;
  }[] | null;
  /** "grid" = square 2-col card (default). "list" = Fresha-style row (photo-left)
   *  for the map-OPEN split. "card" = full-width landscape gallery card (photo on
   *  TOP, text below) - Fresha's real mobile-search shape, photo-led, for map-CLOSED
   *  browse. "suggest" = compact bordered row for the search OVERLAY typing state
   *  (70px photo, name, rating+address, from-price, trailing arrow; no heart/next-slot).
   *  "feed" = the owner-approved BORDERLESS mobile results card (2026-07-02, /dev/results-full
   *  + /dev/results-browse): no card shadow/border, carousel dots, up to 3 gray service-price
   *  rows + a blue "View N matching services" link when a service was searched, else a
   *  right-hand rating + "from CHF X" column. Same card family - only the shape changes
   *  (doctrine V3-D355/D356). */
  variant?: "grid" | "list" | "card" | "suggest" | "feed";
  /** P13 (owner-approved 2026-07-16): "suggest" variant only, the typed search query so the
   *  matched substring inside the name highlights (#FDF6D8 mark). Optional, additive , every
   *  other variant/caller ignores it, no behavior change when absent. */
  matchQuery?: string;
  /** "feed" variant only, real photo count (gallery_urls.length) so the carousel
   *  dots reflect an actual gallery, never a fabricated multi-photo affordance on a
   *  salon with a single cover photo. Dots render only when greater than 1. */ // mockup-ok
  galleryCount?: number | null;
  /** "feed" variant only, true when the results were reached via a typed service
   *  query (renders the up to 3 service price rows plus a "View N" link, the
   *  /dev/results-full state); false/absent = browse state (/dev/results-browse:
   *  rating plus from-price column). */ // mockup-ok
  hasServiceQuery?: boolean;
  /** R4-3 (2026-07-03, owner-approved /dev/spec-chip size M, NO icon): a frosted
   *  TEXT-ONLY specialization chip rendered bottom-left of the feed-variant photo.
   *  The FULLY-LOCALIZED label ("Balayage specialist" / "Spezialist für Balayage"),
   *  built by SearchTemplate from a REAL matched service name or staff specialty when
   *  the user typed a free-text query. NEVER fabricated: null/absent -> no chip.
   *  BadgeCheck icon variant graveyarded (owner: text-only). */
  matchChip?: string | null;
  /** Walk-in live status (variant A), shown only when the walk_in filter is active.
   *  Raw minutes from /api/walkin/availability (the card owns the copy + i18n):
   *  `walkInWaitMin`/`walkInWaitMax` = wait range; 0 → "Jetzt frei". `walkInQueue` = N waiting.
   *  Pass `walkInWaitMin` even when 0, null means "no walk-in data", 0 means "free now". */
  walkInWaitMin?: number | null;
  walkInWaitMax?: number | null;
  walkInQueue?: number | null;
  /** "feed" variant only (map-sheet LIST mode, 2026-07-02): when provided, the card's
   *  main tappable area FOCUSES the salon (calls onSelect(salonId)) instead of navigating
   *  to the PDP. Heart + everything else stays identical. Absent -> unchanged Link behavior. */
  onSelect?: (id: string) => void;
  /** performance-05: opts this card's photo into next/image's `priority`. Set true
   *  ONLY on the first card of the first above-the-fold results grid/list (index 0),
   *  never on every card, or every card competes for preload bandwidth. Defaults to
   *  false/absent so every existing caller keeps today's lazy-load behavior. */
  priority?: boolean;
}

// Exported (V3-D453) so MapSalonDetail.tsx reuses the same category slug->label
// map instead of re-declaring it, per the exists-check anti-duplication rule.
// reinvent-ok: pre-existing constant (content unchanged, only adding `export`);
// searchCategories.ts CATEGORIES is a different shape (icon/bg/fg/hardcoded-count
// for the homepage category picker), not a slug->label map, refactoring this
// pre-existing SalonResultCard categorization source is out of this task's scope.
export const CATEGORY_LABEL: Record<string, string> = {
  coiffeur: "Coiffeur",
  barbershop: "Barber",
  nails: "Nails",
  spa: "Spa",
};

// Locale-derived labels (all 4 locales present, no single-language hardcode).
// Mirrored in messages/{de,en,fr,it}.json under ui.searchChrome; kept inline to
// match the established inline-record pattern in SearchTemplate (MAP_FAB_LABEL).
// Exported (V3-D453) so MapSalonDetail.tsx reuses the same "from" copy.
// "dès", with the accent. Corrected 2026-08-16: this shipped as "des", which is not a typo that
// degrades gracefully, it is a different word. "dès 35 CHF" reads "from 35 CHF"; "des 35 CHF"
// reads "some 35 CHF" and is simply wrong French on every card, every French page. The message
// catalogue had it right the whole time (common.fromPrice = "à partir de {price}"), so only this
// hardcoded map was wrong.
export const FROM_LABEL: Record<string, string> = { de: "ab", en: "from", fr: "dès", it: "da" };

// Walk-in live status copy. Locale-correct. `ahead(n)` = N people in front of you
// (the colored queue count); `join` = the queue CTA; `none` = nobody waiting.
const WALKIN_LABEL: Record<
  string,
  { now: string; free: string; unit: string; ahead: (n: number) => string; join: string; none: string }
> = {
  de: { now: "Jetzt frei", free: "Frei in", unit: "Min", ahead: (n) => `${n} vor Ihnen`, join: "Anstehen", none: "Niemand wartet" },
  en: { now: "Free now", free: "Free in", unit: "min", ahead: (n) => `${n} ahead`, join: "Join", none: "No one waiting" },
  fr: { now: "Libre maintenant", free: "Libre dans", unit: "min", ahead: (n) => `${n} devant`, join: "Rejoindre", none: "Personne en attente" },
  it: { now: "Libero ora", free: "Libero tra", unit: "min", ahead: (n) => `${n} prima`, join: "In fila", none: "Nessuno in attesa" },
};

function formatDistance(m?: number | null): string | null {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// V3-D376 (2026-05-30): hours/minutes unit for the featured-service row.
// copy-i18n-04 (2026-07-27): was hardcoded German ("Std."/"Min.") for every locale;
// the h===1 ternary was dead code (both branches produced the same string), the real
// bug was the missing locale switch, same pattern as WALKIN_LABEL above.
export const DURATION_UNIT: Record<string, { h: string; m: string }> = {
  de: { h: "Std.", m: "Min." },
  en: { h: "h", m: "min" },
  fr: { h: "h", m: "min" },
  it: { h: "h", m: "min" },
};

function formatDuration(mins?: number | null, locale: string = "de"): string | null {
  if (!mins || mins <= 0) return null;
  const u = DURATION_UNIT[locale] ?? DURATION_UNIT.de;
  if (mins < 60) return `${mins} ${u.m}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hPart = `${h} ${u.h}`;
  return m === 0 ? hPart : `${hPart} ${m} ${u.m}`;
}

// ISO slot timestamp → "14:30" in the locale's CH formatting.
function formatSlotTime(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleTimeString(
      locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-CH" : "de-CH",
      { hour: "2-digit", minute: "2-digit" },
    );
  } catch {
    return "";
  }
}

// "feed" variant only (approved /dev/results-full mockup copy): "View N matching
// services" under the max-3 service-price rows, blue small-clickable-bit link.
const VIEW_N_SERVICES_LABEL: Record<string, (n: number) => string> = {
  de: (n) => `${n} weitere passende Services ansehen`,
  en: (n) => `View ${n} matching services`,
  fr: (n) => `Voir ${n} services correspondants`,
  it: (n) => `Vedi ${n} servizi corrispondenti`,
};

// "feed" variant only: "category, N reviews" meta line (per the approved mockup).
// Exported (V3-D453) so MapSalonDetail.tsx reuses the same "N reviews" copy.
export const REVIEWS_LABEL: Record<string, string> = {
  de: "Bewertungen",
  en: "reviews",
  fr: "avis",
  it: "recensioni",
};

function SalonResultCardInner(props: SalonResultCardProps) {
  const {
    slug, name, locale, rating, reviewCount, photoUrl, category,
    city, address, distanceMeters, priceFromCHF, priceFromService, isSaved, salonId,
    nextSlot, services, variant = "grid", matchQuery,
    galleryCount, hasServiceQuery, matchChip,
    walkInWaitMin, walkInQueue,
    onSelect, date,
    priority,
  } = props;

  // GAP #5: carry the searched date onto the PDP link (dropped silently if malformed).
  const href = withDateParam(`/${locale}/salon/${slug}`, date);
  const fromLabel = FROM_LABEL[locale] ?? "ab";
  const wl = WALKIN_LABEL[locale] ?? WALKIN_LABEL.de;
  const catLabel = category ? CATEGORY_LABEL[category] ?? category : null;
  // V3-D374 (user: "just put in address", "too many lines"): location line = the
  // street ADDRESS (e.g. "Spalenvorstadt 22, Basel"), built in SearchTemplate.
  // catLabel/distance stay for /search (both null on a category route).
  const metaBits = [catLabel, city, formatDistance(distanceMeters)]
    .filter(Boolean)
    .join(" ");
  // V3-D374: review count INLINE with the rating ("4.8 (98)") — keeps the social
  // proof but drops the separate reviews line (the card had 5 rows; now 3).
  // Rendered via the <RatingStars> primitive at each site below.
  // V3-D353: monogram fallback initial (matches the homepage SalonCard when no photo).
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";

  // Shared photo fill (next/Image or monogram) - reused by BOTH variants so the
  // photo treatment stays identical across the square card and the list row.
  const photoInner = photoUrl ? (
    <Image
      src={photoUrl}
      alt={`Foto von ${name}`}
      fill
      // draggable=false: the native image drag fires pointercancel and kills the map
      // sheet's scroll<->drag gesture when a thumb starts on the photo (2026-07-02). mockup-ok
      draggable={false}
      style={{ WebkitUserDrag: "none" } as React.CSSProperties}
      sizes={
        variant === "list"
          ? "112px"
          : variant === "card" || variant === "feed"
            ? "(max-width: 768px) 100vw, 420px" // copy-ok
            : "(max-width: 640px) 50vw, 200px" // copy-ok
      }
      className="object-cover"
      priority={priority}
    />
  ) : (
    <span
      className={
        variant === "list"
          ? "absolute inset-0 grid place-items-center font-display font-bold leading-none text-[40px] tracking-[-0.03em] text-s-ink-2"
          : "absolute inset-0 grid place-items-center font-display font-bold leading-none text-[64px] tracking-[-0.03em] text-s-ink-2 md:text-[80px]"
      }
      aria-hidden
    >
      {initial}
    </span>
  );

  // SUGGEST variant (2026-07-01) - compact salon card for the search overlay's typing
  // state. Photo-left (70px, Store-icon fallback), name, rating + address, from-price,
  // trailing arrow. No heart / next-slot (dropdown context). Reuses the card-family
  // primitives (CardName/CardMeta/RatingStars/PriceFrom) so it stays consistent + kills
  // the parallel SalonSuggestCard (council-dedup, 2026-07-01). Whole row is a Link to the
  // PDP; tapping navigates (unmounting + closing the overlay).
  if (variant === "suggest") {
    const line = address ?? city ?? null;
    return (
      <Link href={href} className="group flex items-stretch gap-3 rounded-card border border-s-border bg-white p-3 transition-transform duration-150 active:scale-[0.99] active:duration-[80ms] active:ease-glide">
        {/* mockup-ok: DS-4 nested-radius formula (LOCKFILE:428-431, locked law, not new
            design). Outer rounded-card=16, gap=p-3=12, inner = 16-12 = 4 (was rounded-[12px],
            the exact bulge case LOCKFILE:430 calls out). */}
        <div className="relative h-[70px] w-[70px] shrink-0 overflow-hidden rounded bg-s-bg-sunken">
          {photoUrl ? (
            <Image src={photoUrl} alt={`Foto von ${name}`} fill sizes="70px" className="object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-s-ink-2" aria-hidden>
              <Store size={22} strokeWidth={2.2} />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <CardName as="h3" className="truncate text-[15px] leading-[1.25] tracking-[-0.01em]">
            {matchQuery
              ? splitHighlight(name, matchQuery).map((seg, i) =>
                  seg.match ? (
                    <mark key={i} className="rounded-[3px] bg-[#FDF6D8] text-s-ink no-underline">{seg.text}</mark> /* drift-ok, owner-approved P13 2026-07-16: #FDF6D8 match highlight literal, not a design token */
                  ) : (
                    <Fragment key={i}>{seg.text}</Fragment>
                  ),
                )
              : name}
          </CardName>
          <CardMeta as="div" className="mt-0.5 flex items-center gap-2 text-[12px] leading-[1.35]">
            {rating != null && <RatingStars value={rating} count={reviewCount ?? undefined} size="sm" />}
            {line && (
              <span className="inline-flex min-w-0 items-center gap-0.5">
                <MapPin size={11} className="shrink-0" /> <span className="truncate">{line}</span>
              </span>
            )}
          </CardMeta>
          {priceFromCHF != null && (
            <CardMeta as="div" className="mt-1 text-[13px] leading-[1.35]">
              <PriceFrom amount={priceFromCHF} label={priceFromService ? `${priceFromService} ${fromLabel}` : undefined} emphasis />
            </CardMeta>
          )}
        </div>
        <ArrowRight size={18} strokeWidth={1.9} className="shrink-0 self-center text-s-ink" aria-hidden />
      </Link>
    );
  }

  // V3-D355 (2026-05-28): LIST variant - Fresha-style row (photo-left, text-right).
  // Behind ?layout=list in SearchTemplate; pairs with the desktop map split (one
  // row per pin). Same card family (rounded photo, floating shadow, star, price) -
  // only the shape changes, per the council "one card family, container by surface"
  // doctrine. Heart sits top-right of the ROW (clear of the left-side photo).
  if (variant === "list") {
    return (
      <article className="relative">
        <div className="absolute right-0 top-1 z-10">
          <HeartButton isSaved={isSaved} salonName={name} salonId={salonId} />
        </div>
        <Link href={href} className="group flex items-center gap-3.5 pr-10">
          {/* mockup-ok: photo radius converged to rounded-card (16px), punch-list fix,
              CONSISTENCY_AUDIT.md:35 "Kill 18+22" (owner-approved geometry law, not new design,
              TASTE_LOG.md:187 2026-07-15). Was rounded-[22px], now matches card/grid/feed variants. */}
          <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-card bg-s-bg-sunken shadow-elevation-2 transition-[box-shadow] duration-200 ease-glide group-hover:shadow-elevation-3">
            {photoInner}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-center gap-2">
              <CardName as="h3" className="min-w-0 truncate text-[15px] leading-[1.25] tracking-[-0.01em]">
                {name}
              </CardName>
              {rating != null && (
                <CardMeta className="shrink-0 text-[13px] tabular-nums">
                  <RatingStars value={rating} count={reviewCount ?? undefined} size="sm" />
                </CardMeta>
              )}
            </div>
            {metaBits && (
              <CardMeta as="div" className="mt-1 truncate text-[12.5px] leading-[1.35]">
                {metaBits}
              </CardMeta>
            )}
            {priceFromCHF != null && (
              <CardMeta as="div" className="mt-0.5 text-[12.5px] leading-[1.35]">
                <PriceFrom amount={priceFromCHF} label={priceFromService ? `${priceFromService} ${fromLabel}` : undefined} emphasis />
              </CardMeta>
            )}
            {nextSlot && (
              // V3-D443: green availability pill REMOVED per owner ("don't like the green pill"). Plain ink text.
              <div className="mt-1 inline-flex items-center gap-1.5 font-body text-[12px] font-medium text-s-ink">
                <Calendar size={12} strokeWidth={2} aria-hidden className="text-s-ink-2" />
                <span>{nextSlot}</span>
              </div>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // V3-D356 (2026-05-28): CARD variant - full-width gallery card (landscape photo
  // on TOP, text below). Fresha's real mobile-search shape + photo-led for the
  // beauty vibe; fixes the "sparse / empty gutter" of the grid + list shapes (both
  // read thin because the photo was too small). Same family as the homepage
  // SalonCard (photo-top, name + rating, meta, price) - just full-width + landscape.
  // 1-col on mobile; SearchTemplate puts it in a 2-3 col grid on desktop.
  if (variant === "card") {
    // Walk-in busyness tier — color follows the CROWD size (queue length): ≤2 quiet
    // (green), 3-5 busy (orange), 6+ full (red). Both the bold count + the bar take
    // this hue. Static class strings so Tailwind keeps the utilities at build time.
    const wq = walkInQueue ?? 0;
    const wTier =
      wq <= 2
        ? { text: "text-s-success", bar: "bg-s-success" }
        : wq <= 5
          ? { text: "text-s-surcharge", bar: "bg-s-surcharge" }
          : { text: "text-s-error", bar: "bg-s-error" };
    const wFill = Math.min(Math.max(wq / 8, 0.12), 1); // floor avoids a broken-empty sliver
    // In walk-in mode the WHOLE card taps into the salon PROFILE opened in walk-in mode
    // (?walkin=1 → the PDP's Book/Walk-in toggle starts on Walk-in), NOT the bare
    // /walk-in-join screen. The profile is the richer, already-built walk-in surface.
    const cardHref = walkInWaitMin != null ? withDateParam(`/${locale}/salon/${slug}?walkin=1`, date) : href;
    return (
      <article className="relative">
        <div className="absolute right-2.5 top-2.5 z-10">
          <HeartButton isSaved={isSaved} salonName={name} salonId={salonId} />
        </div>
        <Link href={cardHref} className="group block">
          {/* mockup-ok: CARD_REDESIGN_2026-07-13 (C1, approved card-redesign.html #c11): aspect-[3/2] -> aspect-[5/4] */}
          {/* Photo radius converged to rounded-card (16px) - punch-list fix, CONSISTENCY_AUDIT.md:35
              "Kill 18+22": was rounded-[22px], now the same token as the list/grid/feed variants. */}
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-card bg-s-bg-sunken shadow-elevation-2 transition-[transform,box-shadow] duration-200 ease-glide group-hover:-translate-y-[3px] group-hover:shadow-elevation-3">
            {photoInner}
          </div>
          {/* V3-D356 polish (per Gemini): looser rhythm below the photo + a bigger
              name anchor so the hierarchy reads (was cramped/uniform). */}
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <CardName as="h3" className="min-w-0 truncate text-[18px] leading-[1.15] tracking-[-0.015em]">
              {name}
            </CardName>
            {rating != null && (
              <CardMeta className="shrink-0 text-[13px] tabular-nums">
                <RatingStars value={rating} count={reviewCount ?? undefined} size="sm" />
              </CardMeta>
            )}
          </div>
          {/* Row 2 — WALK-IN mode: address+price LEFT, the bold tier-colored count
              RIGHT (under the rating, on top of the bar). NORMAL mode is unchanged:
              address left, price right. */}
          {walkInWaitMin != null ? (
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <CardMeta as="div" className="min-w-0 truncate text-[13px] leading-[1.4]">
                {metaBits}
                {priceFromCHF != null && (
                  <>
                    {metaBits ? " " : ""}
                    <PriceFrom amount={priceFromCHF} label={priceFromService ? `${priceFromService} ${fromLabel}` : undefined} emphasis />
                  </>
                )}
              </CardMeta>
              {wq > 0 && (
                <div className={`shrink-0 text-[14px] font-bold leading-none tabular-nums ${wTier.text}`}>
                  {wl.ahead(wq)}
                </div>
              )}
            </div>
          ) : (
            (metaBits || priceFromCHF != null) && (
              <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <CardMeta as="div" className="min-w-0 truncate text-[13px] leading-[1.4]">
                  {metaBits}
                </CardMeta>
                {priceFromCHF != null && (
                  <CardMeta as="div" className="shrink-0 text-[13px] leading-[1.4]">
                    <PriceFrom amount={priceFromCHF} label={priceFromService ? `${priceFromService} ${fromLabel}` : undefined} emphasis />
                  </CardMeta>
                )}
              </div>
            )
          )}

          {/* Walk-in busyness bar — bold (6px), full-width, the tier hue, the card's
              bottom edge. Display-only, so it lives inside the Link (whole card taps
              through to the join flow). */}
          {walkInWaitMin != null && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-s-border">
              <div className={`h-full rounded-full ${wTier.bar}`} style={{ width: `${Math.round(wFill * 100)}%` }} />
            </div>
          )}
        </Link>
      </article>
    );
  }

  // FEED variant (2026-07-02, owner-approved /dev/results-full + /dev/results-browse):
  // the mobile 1-col results feed. Borderless (no card shadow/border, per the mockup),
  // rounded-card photo, carousel dots (real gallery_urls count, only when > 1), then
  // name + inline star, "distance, address" line, "category, N reviews" line. Searched
  // state (hasServiceQuery) adds up to 3 gray service-price rows plus a blue "View N"
  // link; browse state swaps in a right-hand rating + "from CHF X" column instead.
  if (variant === "feed") {
    const line1 = [distanceMeters != null ? formatDistance(distanceMeters) : null, address ?? city]
      .filter(Boolean)
      .join(", ");
    const line2 = [catLabel, reviewCount != null && reviewCount > 0 ? `${reviewCount} ${REVIEWS_LABEL[locale] ?? REVIEWS_LABEL.de}` : null]
      .filter(Boolean)
      .join(", ");
    const rows = (services ?? []).filter((s) => s.price != null).slice(0, 3);
    const moreCount = Math.max(0, (services?.filter((s) => s.price != null).length ?? 0) - rows.length);
    const viewNLabel = (VIEW_N_SERVICES_LABEL[locale] ?? VIEW_N_SERVICES_LABEL.de)(moreCount);
    const dotCount = Math.min(galleryCount ?? 0, 3);
    // V3-D453 (2026-07-02, map-behavior mockup): when onSelect is provided (map-sheet
    // LIST mode) the card content is wrapped in a <button> that FOCUSES the salon
    // instead of navigating (same visual as the <Link>). No onSelect, unchanged
    // Link-to-PDP behavior. HeartButton renders OUTSIDE the tappable element (a
    // sibling in <article>, absolutely positioned over the photo) because a native
    // <button> cannot validly nest another <button> (invalid HTML, hydration
    // error); the <Link> variant keeps it nested since an <a> CAN contain a button.
    // w-full text-left only NEUTRALIZE native <button> centering so it matches the
    // <Link> block layout exactly, no new appearance. mockup-ok
    const feedPhoto = (
      // mockup-ok: CARD_REDESIGN_2026-07-13 (C1, approved card-redesign.html #c11): aspect-[3/2] -> aspect-[5/4]
      // Photo radius notation converged to rounded-card (punch-list fix): rounded-2xl was already
      // numerically 16px (tailwind.config.js), same token name as the other three variants now.
      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-card bg-s-bg-sunken">
        {photoInner}
        {!onSelect && (
          <div className="absolute right-3 top-3 z-10">
            <HeartButton isSaved={isSaved} salonName={name} salonId={salonId} size={36} iconSize={16} />
          </div>
        )}
        {/* R4-3: frosted TEXT-ONLY specialization chip, size M (12px / px-2.5 py-1 /
            semibold ink), bottom-left of the photo. FROST_GLASS (lib/frost-glass.ts).
            Rendered only when SearchTemplate resolved a REAL match for the typed query
            (no fabrication). No icon (BadgeCheck graveyarded, owner 2026-07-03).
            mockup-ok: owner-approved /dev/spec-chip size M, IMPLEMENT (SEARCH_MAP_OVERHAUL R4-3). */}
        {matchChip && (
          <span
            className="absolute bottom-2.5 left-2.5 z-10 max-w-[calc(100%-20px)] truncate rounded-pill px-2.5 py-1 font-body text-[12px] font-semibold leading-none text-s-ink" // mockup-ok: /dev/spec-chip M approved
            style={FROST_GLASS}
          >
            {matchChip}
          </span>
        )}
        {dotCount > 1 && (
          <span className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
            {Array.from({ length: dotCount }).map((_, i) => (
              <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-white" : "bg-white/55")} />
            ))}
          </span>
        )}
      </div>
    );
    const feedInner = (
      <>
        {feedPhoto}
        {hasServiceQuery ? (
          // SEARCHED state (/dev/results-full): name + inline star on one row, then
          // the two meta lines, then up to 3 service-price rows + "View N" link.
          <div className="pt-2.5">
            <div className="flex items-start justify-between gap-2">
              <CardName as="p" className="truncate font-heading text-[16px] font-bold">
                {name}
              </CardName>
              {rating != null && (
                <span className="flex shrink-0 items-center gap-1 text-[14px] font-semibold text-s-ink tabular-nums">
                  <RatingStars value={rating} count={reviewCount ?? undefined} size="md" />
                </span>
              )}
            </div>
            {line1 && <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{line1}</p>}
            {line2 && <p className="truncate text-[13px] text-s-ink-2">{line2}</p>}
            {rows.length > 0 && (
              <>
                <div className="mt-2.5 space-y-1.5">
                  {rows.map((s) => {
                    const svcName = (locale === "en" && s.name_en ? s.name_en : s.name_de) ?? "";
                    const dur = formatDuration(s.duration_minutes, locale);
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-s-bg-sunken px-3.5 py-2.5 text-[13.5px]">
                        <span className="min-w-0">
                          <span className="block truncate text-s-ink">{svcName}</span>
                          {dur && <span className="text-[12px] text-s-ink-2">{dur}</span>}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-s-ink">{s.price} CHF</span>
                      </div>
                    );
                  })}
                </div>
                {moreCount > 0 && (
                  <span className="mt-3 block text-[13.5px] font-semibold text-s-accent">{viewNLabel}</span>
                )}
              </>
            )}
          </div>
        ) : (
          // BROWSE state (/dev/results-browse): ONE row, name/meta stacked LEFT,
          // rating + "from CHF X" stacked RIGHT with a gap under the rating.
          <div className="flex items-start justify-between gap-3 pt-2.5">
            <div className="min-w-0">
              <CardName as="p" className="truncate font-heading text-[16px] font-bold">
                {name}
              </CardName>
              {line1 && <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{line1}</p>}
              {line2 && <p className="truncate text-[13px] text-s-ink-2">{line2}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2.5">
              {rating != null && (
                <span className="flex items-center gap-1 text-[14px] font-semibold text-s-ink tabular-nums">
                  <RatingStars value={rating} count={reviewCount ?? undefined} size="md" />
                </span>
              )}
              {priceFromCHF != null && (
                <CardMeta as="span" className="text-[13.5px] font-semibold text-s-ink">
                  <PriceFrom amount={priceFromCHF} label={priceFromService ? `${priceFromService} ${fromLabel}` : undefined} emphasis />
                </CardMeta>
              )}
            </div>
          </div>
        )}
      </>
    );

    // onSelect present (map-sheet LIST mode) -> button neutralizes native centering
    // (w-full text-left) so it matches the Link's block layout, mockup-ok, no new
    // appearance. No onSelect -> unchanged <Link> to the PDP. HeartButton is a
    // SIBLING of the button (not nested, invalid HTML), positioned to still sit
    // over the photo's top-right corner exactly like the Link variant.
    return (
      <article className="relative">
        {onSelect && (
          <div className="absolute right-3 top-3 z-10">
            <HeartButton isSaved={isSaved} salonName={name} salonId={salonId} size={36} iconSize={16} />
          </div>
        )}
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(salonId ?? slug)}
            className="block w-full text-left active:opacity-90"
          >
            {feedInner}
          </button>
        ) : (
          <Link href={href} className="block active:opacity-90">
            {feedInner}
          </Link>
        )}
      </article>
    );
  }

  return (
    <article className="relative">
      {/* Heart is a sibling of the Link (not nested) to keep valid HTML. */}
      <div className="absolute right-1.5 top-1.5 z-10">
        <HeartButton isSaved={isSaved} salonName={name} salonId={salonId} />
      </div>

      <Link href={href} className="group block">
        {/* V3-D353 (2026-05-28): photo treatment matched to the homepage SalonCard
            so the two read as ONE card family (Option 1) — rounded-[22px], soft
            floating shadow + hover lift/scale, next/Image, monogram fallback, and
            the rounded-[10px] badge geometry. The 2-col grid + search-only data
            (distance, popularity heuristic) stay. Supersedes the V3-D350 flat
            rounded-card look per user "keep it consistent with the locked homepage". */}
        {/* mockup-ok: CARD_REDESIGN_2026-07-13 (C1, approved card-redesign.html #c11): aspect-square -> aspect-[5/4] */}
        {/* Photo radius converged to rounded-card (16px) - punch-list fix, CONSISTENCY_AUDIT.md:35
            "Kill 18+22": was rounded-[22px], now the same token as the list/card/feed variants. */}
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-card bg-s-bg-sunken shadow-elevation-2 transition-[transform,box-shadow] duration-200 ease-glide group-hover:-translate-y-[3px] group-hover:scale-[1.015] group-hover:shadow-elevation-3">
          {photoInner}
        </div>

        {/* Row 1 — name (the one ink anchor) + ★ rating inline. */}
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <CardName as="h3" className="min-w-0 truncate text-[14px] leading-[1.25] tracking-[-0.01em]">
            {name}
          </CardName>
          {rating != null && (
            <CardMeta className="shrink-0 text-[13px] tabular-nums">
              <RatingStars value={rating} count={reviewCount ?? undefined} size="sm" />
            </CardMeta>
          )}
        </div>

        {/* Row 2 — grey meta line: category · city · distance.
            NOTE (V3-D352): the homepage Row 2 uses s-ink-2, but in this B&W config
            s-ink-2 === s-ink-2 (both the same grey), so CardMeta's baked s-ink-2 already
            matches the homepage exactly - no override / raw div needed. */}
        {metaBits && (
          <CardMeta as="div" className="mt-0.5 truncate text-[12px] leading-[1.35]">
            {metaBits}
          </CardMeta>
        )}

        {/* V3-D374: booking row — "ab X CHF" + next-slot pill on ONE line. */}
        {(priceFromCHF != null || nextSlot) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {priceFromCHF != null && (
              <CardMeta as="span" className="text-[12px] leading-[1.35]">
                <PriceFrom amount={priceFromCHF} label={priceFromService ? `${priceFromService} ${fromLabel}` : undefined} emphasis />
              </CardMeta>
            )}
            {nextSlot && (
              // V3-D443: green availability pill REMOVED per owner. Plain ink text.
              <span className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-s-ink">
                <Calendar size={12} strokeWidth={2} aria-hidden className="text-s-ink-2" />
                {nextSlot}
              </span>
            )}
          </div>
        )}
      </Link>
    </article>
  );
}

// Memoized: re-render only when the card's own identity (salonId) or saved state
// changes. A favorite toggle in SearchTemplate replaces the favoriteIds Set which
// re-renders the parent, but each individual card should stay stable unless it is
// the one that was toggled.
export const SalonResultCard = memo(SalonResultCardInner, (prev, next) => {
  return prev.salonId === next.salonId && prev.isSaved === next.isSaved;
});
