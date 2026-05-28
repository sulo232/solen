import Link from "next/link";
import Image from "next/image";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";

/**
 * CategoryPromos — V3-D75-promos (2026-05-18).
 *
 * Uber-style horizontally-swipeable category promo cards. One card per
 * Solen category (Coiffeur / Barbershop / Nails / Spa & Wellness). Each
 * card has its own distinctive bg color, big headline, dark CTA pill,
 * and an illustration/photo on the right.
 *
 * Why this pattern: gives users a top-level browsing path BY category
 * (vs. browsing by salon/stylist/availability which the rest of the
 * homepage already handles). The colorful cards add visual variety
 * to the otherwise-uniform white-card feed.
 *
 * Layout: scroll-snap x-mandatory. Cards `aspect-[2/1]` for landscape
 * proportion. Width ~88vw on mobile so next card peeks at right edge —
 * gives the explicit "there's more, swipe →" affordance.
 *
 * Phase 2 wiring: each card routes to `/${slug}` which already exists
 * as the category page route. Photo URLs come from real production
 * salon imagery so the cards stay visually current.
 */

interface CategoryPromo {
  slug: string;
  headline: string;
  cta: string;
  /** User-supplied oil-painting illustration under public/illustrations/categories/ */
  photo: string;
}

// V3-D116-fu1 (2026-05-23): user correction "no make ful pic n jst text and
// button on top and i made illustrations bro." New design:
//   - FULL-BG illustration (absolute inset-0 fill)
//   - Text + button OVERLAID on bottom of tile (no split, no peek-from-right)
//   - Dark-to-transparent gradient at bottom for text legibility
//   - White headline + white-bg-ink-text pill CTA
// Illustrations: user-supplied oil-painting renderings at
// public/illustrations/categories/ (coiffeur.png / barber.png / nails.png).
// Launch scope (per user 2026-05-23): coiffeur / barber / nails only. Spa
// entry removed; re-add when launch scope expands.
const CATEGORIES: CategoryPromo[] = [
  {
    slug: "coiffeur",
    headline: "Schneiden, färben, stylen",
    cta: "Coiffeur entdecken",
    photo: "/illustrations/categories/coiffeur.png",
  },
  {
    slug: "barbershop",
    headline: "Fade, Bart, klassische Schere",
    cta: "Barber finden",
    photo: "/illustrations/categories/barber.png",
  },
  {
    slug: "nails",
    headline: "Gel, Nail-Art, Pflege",
    cta: "Nail-Studio buchen",
    photo: "/illustrations/categories/nails.png",
  },
];

export default function CategoryPromos() {
  return (
    <Section>
      <SectionFrame>
        <SectionTitle title="Stöber nach Kategorie." />
        <div
          className="salon-card-stagger mt-3 flex gap-3 overflow-x-auto py-1 [-webkit-overflow-scrolling:touch] [scroll-snap-type:x_mandatory] [scrollbar-width:none] -mx-3 px-3 md:-mx-5 md:px-5 [&::-webkit-scrollbar]:hidden"
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="group relative aspect-[2/1] w-[88vw] max-w-[440px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-s-bg-sunken transition-all duration-300 ease-out hover:-translate-y-[2px] active:scale-[0.98]"
              aria-label={`${c.cta} — ${c.headline}`}
            >
              {/* Full-bleed illustration */}
              <Image
                src={c.photo}
                alt=""
                fill
                sizes="(max-width: 768px) 88vw, 440px"
                className="object-cover object-center transition-transform duration-500 ease-glide group-hover:scale-[1.04]"
                priority={c.slug === "coiffeur"}
              />
              {/* V3-D118 (2026-05-24): dark gradient overlay REMOVED per user
                  "remove ths shadow thing inside of the card." Text legibility
                  now handled purely by stronger text-shadow on the headline
                  (no full-card darkening). Headline shrunk + width-constrained
                  to force a clean 2-line wrap. Pill scaled down to match. */}
              <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-4 md:p-5">
                <h3
                  className="font-display font-semibold leading-[1.05] text-white max-w-[60%]"
                  style={{
                    fontSize: "clamp(15px, 3.5vw, 18px)",
                    letterSpacing: "-0.015em",
                    textShadow: "0 1px 4px rgba(0,0,0,0.7), 0 2px 10px rgba(0,0,0,0.55)",
                  }}
                >
                  {c.headline}
                </h3>
                <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 font-body text-[11px] font-bold text-s-ink shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-glide group-hover:translate-x-1">
                  {c.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </SectionFrame>
    </Section>
  );
}
