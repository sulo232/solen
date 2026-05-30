import Link from "next/link";
import Image from "next/image";
import { Star, Clock } from "lucide-react";
import { CardName, CardMeta } from "../primitives";
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
  /** V3-D372: review count shown as "(124)" beside the rating - Fresha's category
   *  list shows "N reviews"; Solen keeps it grey/recessive (A13: name stays the one
   *  ink anchor). Hidden when 0/absent. */
  reviewCount?: number | null;
  isSaved?: boolean;
  salonId?: string;
  /** V3-D357: earliest available slot label ("heute 15:30") - the booking hook +
   *  the content that stops the card reading empty. Computed in SearchTemplate. */
  nextSlot?: string | null;
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
   *  browse. Same card family - only the shape changes (doctrine V3-D355/D356). */
  variant?: "grid" | "list" | "card";
}

const CATEGORY_LABEL: Record<string, string> = {
  coiffeur: "Coiffeur",
  barbershop: "Barber",
  nails: "Nails",
  spa: "Spa",
  makeup: "Makeup",
  waxing: "Waxing",
};

// Locale-derived labels (all 4 locales present — no single-language hardcode).
// Mirrored in messages/{de,en,fr,it}.json under ui.searchChrome; kept inline to
// match the established inline-record pattern in SearchTemplate (MAP_FAB_LABEL).
const FROM_LABEL: Record<string, string> = { de: "ab", en: "from", fr: "des", it: "da" };

function formatDistance(m?: number | null): string | null {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// V3-D376 (2026-05-30): "Std." German hours unit for the featured-service row.
function formatDuration(mins?: number | null): string | null {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} Min.`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hPart = h === 1 ? "1 Std." : `${h} Std.`;
  return m === 0 ? hPart : `${hPart} ${m} Min.`;
}

// ISO slot timestamp → "14:30" in the locale's CH formatting.
function formatSlotTime(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleTimeString(
      locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-GB" : "de-CH",
      { hour: "2-digit", minute: "2-digit" },
    );
  } catch {
    return "";
  }
}

const ALL_SVC_LABEL: Record<string, string> = {
  de: "Alle Services ansehen",
  en: "View all services",
  fr: "Voir tous les services",
  it: "Vedi tutti i servizi",
};

export function SalonResultCard(props: SalonResultCardProps) {
  const {
    slug, name, locale, rating, reviewCount, photoUrl, category,
    city, distanceMeters, priceFromCHF, isSaved, salonId,
    nextSlot, services, variant = "grid",
  } = props;

  const href = `/${locale}/salon/${slug}`;
  const fromLabel = FROM_LABEL[locale] ?? "ab";
  const catLabel = category ? CATEGORY_LABEL[category] ?? category : null;
  // V3-D374 (user: "just put in address", "too many lines"): location line = the
  // street ADDRESS (e.g. "Spalenvorstadt 22, Basel"), built in SearchTemplate.
  // catLabel/distance stay for /search (both null on a category route).
  const metaBits = [catLabel, city, formatDistance(distanceMeters)]
    .filter(Boolean)
    .join(" · ");
  // V3-D374: review count INLINE with the rating ("4.8 (98)") — keeps the social
  // proof but drops the separate reviews line (the card had 5 rows; now 3).
  const ratingText =
    rating != null ? rating.toFixed(1) + (reviewCount && reviewCount > 0 ? ` (${reviewCount})` : "") : null;
  // V3-D353: monogram fallback initial (matches the homepage SalonCard when no photo).
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";

  // V3-D376: featured service for the card booking block — prefer one with open
  // slots, else the first. Its slots (ISO) format to HH:MM; each pill links into
  // booking with that service preselected. "Alle Services" → the PDP service list.
  const featured = services?.find((s) => (s.slots?.length ?? 0) > 0) ?? services?.[0] ?? null;
  const featuredName = featured
    ? (locale === "en" && featured.name_en ? featured.name_en : featured.name_de) ?? null
    : null;
  const featuredDur = featured ? formatDuration(featured.duration_minutes) : null;
  const featuredSlots = (featured?.slots ?? []).slice(0, 3);
  const hasMoreSlots = (featured?.slots?.length ?? 0) > 3;
  const allServicesLabel = ALL_SVC_LABEL[locale] ?? ALL_SVC_LABEL.de;

  // Shared photo fill (next/Image or monogram) - reused by BOTH variants so the
  // photo treatment stays identical across the square card and the list row.
  const photoInner = photoUrl ? (
    <Image
      src={photoUrl}
      alt={`Foto von ${name}`}
      fill
      sizes={
        variant === "list"
          ? "112px"
          : variant === "card"
            ? "(max-width: 768px) 100vw, 420px"
            : "(max-width: 640px) 50vw, 200px"
      }
      className="object-cover"
    />
  ) : (
    <span
      className={
        variant === "list"
          ? "absolute inset-0 grid place-items-center font-display font-black leading-none text-[40px] tracking-[-0.03em] text-s-ink-3"
          : "absolute inset-0 grid place-items-center font-display font-black leading-none text-[64px] tracking-[-0.03em] text-s-ink-3 md:text-[80px]"
      }
      aria-hidden
    >
      {initial}
    </span>
  );

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
          <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[16px] bg-s-bg-sunken shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-[box-shadow] duration-200 ease-glide group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
            {photoInner}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex items-center gap-2">
              <CardName as="h3" className="min-w-0 truncate text-[15px] leading-[1.25] tracking-[-0.01em]">
                {name}
              </CardName>
              {rating != null && (
                <CardMeta className="flex shrink-0 items-center gap-[3px] text-[13px] tabular-nums">
                  <Star size={11} fill="#FFC32B" stroke="none" aria-hidden />
                  {ratingText}
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
                {fromLabel} {priceFromCHF} CHF
              </CardMeta>
            )}
            {nextSlot && (
              <div className="mt-1 inline-flex items-center gap-1.5 font-body text-[12px] font-medium text-s-ink">
                <Clock size={12} strokeWidth={2} aria-hidden className="text-s-ink-2" />
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
    return (
      <article className="relative">
        <div className="absolute right-2.5 top-2.5 z-10">
          <HeartButton isSaved={isSaved} salonName={name} salonId={salonId} />
        </div>
        <Link href={href} className="group block">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[18px] bg-s-bg-sunken shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-200 ease-glide group-hover:-translate-y-[3px] group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)]">
            {photoInner}
          </div>
          {/* V3-D356 polish (per Gemini): looser rhythm below the photo + a bigger
              name anchor so the hierarchy reads (was cramped/uniform). */}
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <CardName as="h3" className="min-w-0 truncate text-[16px] leading-[1.2] tracking-[-0.015em]">
              {name}
            </CardName>
            {rating != null && (
              <CardMeta className="flex shrink-0 items-center gap-[3px] text-[13px] tabular-nums">
                <Star size={12} fill="#FFC32B" stroke="none" aria-hidden />
                {ratingText}
              </CardMeta>
            )}
          </div>
          {metaBits && (
            <CardMeta as="div" className="mt-1.5 truncate text-[13px] leading-[1.4]">
              {metaBits}
            </CardMeta>
          )}
        </Link>

        {/* V3-D376: featured service + bookable slot pills + "Alle Services" link.
            OUTSIDE the card <Link> so these nested links stay valid HTML. Falls
            back to the V3-D374 price + next-slot row when a salon has no services. */}
        {featured ? (
          <div className="mt-3 border-t border-s-border pt-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                {featuredName && (
                  <p className="truncate font-body text-[14px] font-medium text-s-ink">{featuredName}</p>
                )}
                {featuredDur && <p className="mt-0.5 font-body text-[12.5px] text-s-ink-3">{featuredDur}</p>}
              </div>
              {featured.price != null && (
                <p className="shrink-0 font-body text-[13px] font-semibold text-s-ink">
                  {fromLabel} {featured.price} CHF
                </p>
              )}
            </div>
            {featuredSlots.length > 0 && (
              // V3-D377: time pills are desktop-only — they read cluttered on the
              // mobile card (user 2026-05-30). Mobile keeps the featured service +
              // price + "Alle Services"; the slot grid shows from md up.
              <div className="mt-2.5 hidden items-center gap-2 md:flex">
                {featuredSlots.map((iso, i) => (
                  <Link
                    key={iso}
                    href={`/${locale}/salon/${slug}/booking?service=${featured.id}&start=${encodeURIComponent(iso)}`}
                    className={`rounded-[10px] border px-3 py-1.5 font-body text-[12.5px] font-semibold transition-colors ${
                      i === 0 ? "border-s-ink bg-s-ink text-white" : "border-s-border text-s-ink hover:border-s-ink/40"
                    }`}
                  >
                    {formatSlotTime(iso, locale)}
                  </Link>
                ))}
                {hasMoreSlots && (
                  <Link
                    href={`/${locale}/salon/${slug}/booking?service=${featured.id}`}
                    className="flex h-[34px] w-9 items-center justify-center rounded-[10px] border border-s-border font-body text-[15px] font-bold leading-none text-s-ink-3 hover:border-s-ink/40"
                    aria-label="Mehr Zeiten"
                  >
                    ⋯
                  </Link>
                )}
              </div>
            )}
            <Link href={`${href}#section-services`} className="mt-3 inline-block font-body text-[13px] font-semibold text-s-accent">
              {allServicesLabel} →
            </Link>
          </div>
        ) : (priceFromCHF != null || nextSlot) ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {priceFromCHF != null && (
              <CardMeta as="span" className="text-[13px] leading-[1.4]">
                {fromLabel} {priceFromCHF} CHF
              </CardMeta>
            )}
            {nextSlot && (
              <span className="inline-flex items-center gap-1 font-body text-[12.5px] font-medium text-s-ink">
                <Clock size={13} strokeWidth={2} aria-hidden className="text-s-ink-2" />
                {nextSlot}
              </span>
            )}
          </div>
        ) : null}
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
        <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-s-bg-sunken shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-200 ease-glide group-hover:-translate-y-[3px] group-hover:scale-[1.015] group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)]">
          {photoInner}
        </div>

        {/* Row 1 — name (the one ink anchor) + ★ rating inline. */}
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <CardName as="h3" className="min-w-0 truncate text-[14px] leading-[1.25] tracking-[-0.01em]">
            {name}
          </CardName>
          {rating != null && (
            <CardMeta className="flex shrink-0 items-center gap-[3px] text-[13px] tabular-nums">
              <Star size={11} fill="#FFC32B" stroke="none" aria-hidden />
              {ratingText}
            </CardMeta>
          )}
        </div>

        {/* Row 2 — grey meta line: category · city · distance.
            NOTE (V3-D352): the homepage Row 2 uses s-ink-3, but in this B&W config
            s-ink-2 === s-ink-3 (both #6B6B6B), so CardMeta's baked s-ink-2 already
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
                {fromLabel} {priceFromCHF} CHF
              </CardMeta>
            )}
            {nextSlot && (
              <span className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-s-ink">
                <Clock size={12} strokeWidth={2} aria-hidden className="text-s-ink-2" />
                {nextSlot}
              </span>
            )}
          </div>
        )}
      </Link>
    </article>
  );
}
