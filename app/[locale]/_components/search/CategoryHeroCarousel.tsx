"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { HeartButton } from "../homepage/HeartButton";
import { RatingStars } from "@/app/[locale]/_components/primitives";

/**
 * CategoryHeroCarousel — V3-D421 (2026-06-05, owner-approved design "B").
 *
 * A black, photo-led FEATURED carousel ("Top bewertet") shown ABOVE the results
 * grid on a category route in browse mode (no query + no active filter). One big
 * card per swipe, peek of the next, pagination dots. It is the highlight strip a
 * user swipes through — deliberately a DIFFERENT treatment from the white results
 * grid below (black hero vs white cards) so the same salon appearing in both does
 * not read as "the list shown twice".
 *
 * Data: a top-rated slice (by average_rating, photo required) of the `salons`
 * array SearchTemplate already fetched — no extra network. Self-hides when fewer
 * than 2 qualifying salons exist (a single card is not a carousel).
 *
 * Universal (V3-D205): one component for every category; category is implied by
 * the page, so it isn't even a prop. Reuses the locked HeartButton + Star #FFC32B.
 *
 * AESTHETIC (LOCKFILE): black surface = s-ink; the "Top bewertet" badge is the
 * white frosted curation chip; gradient is pure black (no hue). The primary-CTA
 * ink discipline is unaffected — this is a surface, not a button.
 *
 * Reference: owner's Uber "nach category" capture (dark swipable promo carousel)
 * + the approved mock at public/solen-widget-variants.html (take B).
 */

type HeroSalon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number | null;
  review_count?: number | null;
  cover_photo_url: string | null;
  address?: string;
  quartier?: string | null;
  avg_price?: number | null;
};

// Per-locale title + "ab" label (inline-record pattern, mirrors CategoryBrowseRails).
const TITLE: Record<string, string> = { de: "Top bewertet", en: "Top rated", fr: "Les mieux notés", it: "Più votati" };
const FROM: Record<string, string> = { de: "ab", en: "from", fr: "dès", it: "da" };
const pick = (r: Record<string, string>, l: string) => r[l] ?? r.de;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function CategoryHeroCarousel({
  salons,
  locale,
  favoriteIds,
}: {
  salons: HeroSalon[];
  locale: string;
  favoriteIds: Set<string>;
}) {
  const t = useTranslations("common");
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);

  // Top-rated, photo required (the card is photo-led), max 6.
  const top = React.useMemo(
    () =>
      [...salons]
        .filter((s) => s.average_rating != null && !!s.cover_photo_url)
        .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
        .slice(0, 6),
    [salons],
  );

  const onScroll = React.useCallback(() => {
    const el = ref.current;
    if (!el || top.length < 2) return;
    const max = el.scrollWidth - el.clientWidth;
    const idx = max > 0 ? Math.round((el.scrollLeft / max) * (top.length - 1)) : 0;
    setActive(idx);
  }, [top.length]);

  // Dots are real controls: tapping one scrolls the carousel to that card.
  // inline:start scrolls the horizontal track; block:nearest avoids a vertical page jump.
  const scrollToIndex = React.useCallback((i: number) => {
    const child = ref.current?.children?.[i] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }, []);

  if (top.length < 2) return null;

  const title = pick(TITLE, locale);

  return (
    <section className="mx-auto w-full max-w-[680px] px-4 pt-5 md:px-6" aria-label={title}>
      {/* ONE FIXED CARD FRAME (V3-D421c → "B" applied V3-D421i, 2026-06-05, owner): one card,
          content swipes INSIDE it (Zemart). Frame + shadow stay put; the swipe TRACK lives
          inside (clipped by overflow-hidden). V3-D421i changes: the "Top bewertet" SECTION
          TITLE + the on-card BADGE are removed (no label), the card is enlarged to 5:4, and the
          pagination dots move INSIDE the card (below). `title` is kept for a11y aria only. */}
      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[22px] bg-s-ink shadow-elevation-2">

        {/* inner swipe track — fills + scrolls inside the fixed frame */}
        <div
          ref={ref}
          onScroll={onScroll}
          className="scrollbar-none absolute inset-0 flex snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {top.map((s) => {
            const addr = s.address || (s.quartier ? cap(s.quartier) : null);
            const price = s.avg_price ?? null;
            return (
              <article key={s.id} className="relative h-full shrink-0 basis-full snap-start">
                <Link
                  href={`/${locale}/salon/${s.slug}`}
                  aria-label={`${s.name}, Termin buchen`}
                  className="group relative block h-full w-full"
                >
                  <Image
                    src={s.cover_photo_url as string}
                    alt={t("photoOf", { name: s.name })}
                    fill
                    sizes="(max-width: 768px) 100vw, 680px"
                    className="object-cover transition-transform duration-300 ease-glide group-hover:scale-[1.03]"
                  />
                  {/* pure-black bottom-up gradient so the white text reads (no hue). */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        // DS-10 (2026-06-11): top wash removed — the photo stays clean above the
                        // text zone; the gradient only earns contrast where text sits.
                        "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0) 72%)",
                    }}
                    aria-hidden
                  />

                  <div
                    className="absolute inset-x-4 bottom-9 text-white"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
                  >
                    {/* text-white is REQUIRED: a global `h3 { color: var(--color-heading) }`
                        rule (globals.css) sets bare headings to ink and overrides the parent's
                        inherited text-white. The class beats the element rule.
                        ig8 (owner-approved 2026-07-16): font-bold (700) -> font-semibold (600)
                        so the white-on-photo name matches the 600 ink-on-white name weight
                        used elsewhere; avoids the irradiation effect of a heavy weight on a
                        light-on-dark surface reading heavier than the same weight on light. */}
                    <h3 className="font-display text-[24px] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
                      {s.name}
                    </h3>
                    {s.average_rating != null && s.review_count != null && s.review_count > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 font-body text-[13.5px] tabular-nums">
                        <RatingStars value={s.average_rating} count={s.review_count} size="md" />
                      </div>
                    )}
                    {(price != null || addr) && (
                      <div className="mt-0.5 font-body text-[13px] text-white/80">
                        {/* "ab {N} CHF" — currency-suffix per the PriceFrom primitive
                            (CONTRADICTIONS.md §4); was "ab CHF {N}", the one deviation. */}
                        {price != null ? `${pick(FROM, locale)} ${price} CHF` : ""}
                        {price != null && addr ? " " : ""}
                        {addr ?? ""}
                      </div>
                    )}
                  </div>
                </Link>

                {/* heart per-pane (per salon) — sibling of Link (valid HTML), above content */}
                <div className="absolute right-3 top-3 z-[3]">
                  <HeartButton isSaved={favoriteIds.has(s.id)} salonName={s.name} salonId={s.id} />
                </div>
              </article>
            );
          })}
        </div>

        {/* V3-D421i: pagination dots INSIDE the card (overlaid bottom-center, white on the
            gradient), real buttons (tap to advance, aria-label + aria-current). The row is
            pointer-events-none so it never blocks a swipe; only the dot buttons are tappable. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[3] flex justify-center">
          {top.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`${title} ${i + 1}/${top.length}`}
              aria-current={i === active ? "true" : undefined}
              className="pointer-events-auto grid min-h-[34px] place-items-center rounded-full px-1.5 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            >
              {/* THE SPEED LAW hard rule 2 (motion audit HOME_SEARCH_INSPO.md row 117): was
                  `transition-all` over `w-[7px]` <-> `w-[22px]`, animating WIDTH. A `scaleX` on one
                  shape would also work the FILL bar (row 100) but would distort THIS shape: scaling a
                  rounded-full circle horizontally flattens its round caps into an ellipse, an actually
                  visible defect on a 7px dot. Instead both fixed-size shapes (circle, pill) are always
                  present, stacked in one grid cell, and crossfaded by opacity , same tier the LAW
                  assigns an in-place state flip (snap 150; the 300ms here was also off-ladder). */}
              <span className="relative grid h-[7px] w-[22px] place-items-center">
                <span
                  aria-hidden
                  className={`col-start-1 row-start-1 h-[7px] w-[7px] rounded-full bg-white/55 transition-opacity duration-150 ease-glide ${i === active ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  aria-hidden
                  className={`col-start-1 row-start-1 h-[7px] w-[22px] rounded-[4px] bg-white transition-opacity duration-150 ease-glide ${i === active ? "opacity-100" : "opacity-0"}`}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
