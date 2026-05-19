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
  bg: string;
  textColor: string;
  pillBg: string;
  pillText: string;
  photo: string;
}

// V3 Earthen Wellness Light cat tokens (CLAUDE.md §design system, V2-D60).
//   Coiffeur → peach + warm terracotta.
//   Barbershop → contrast cat (dark bg + bone pill) — gives the carousel
//     a visual breath between three light cards.
//   Nails → sage-pale + terra-deep.
//   Spa → emerald-subtle + emerald-mid.
const CATEGORIES: CategoryPromo[] = [
  {
    slug: "coiffeur",
    headline: "Schneiden, färben, stylen",
    cta: "Coiffeur entdecken",
    bg: "#FFE8D8",
    textColor: "#1A1C19",
    pillBg: "#1A1C19",
    pillText: "#FFFFFF",
    photo:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=600&fit=crop&q=80",
  },
  {
    slug: "barbershop",
    headline: "Fade, Bart, klassische Schere",
    cta: "Barber finden",
    bg: "#1A1C19",
    textColor: "#EAE0D0",
    pillBg: "#EAE0D0",
    pillText: "#1A1C19",
    photo:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop&q=80",
  },
  {
    slug: "nails",
    headline: "Gel, Nail-Art, Pflege",
    cta: "Nail-Studio buchen",
    bg: "#D4DDC8",
    textColor: "#1A1C19",
    pillBg: "#1A1C19",
    pillText: "#FFFFFF",
    photo:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&q=80",
  },
  {
    slug: "spa",
    headline: "Massage, Sauna, Pause",
    cta: "Wellness entdecken",
    bg: "#D4F2E0",
    textColor: "#1A1C19",
    pillBg: "#1A1C19",
    pillText: "#FFFFFF",
    photo:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop&q=80",
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
              className="group relative aspect-[2/1] w-[88vw] max-w-[440px] shrink-0 snap-start overflow-hidden rounded-[20px] transition-all duration-300 ease-out hover:-translate-y-[2px] active:scale-[0.98]"
              style={{
                background: c.bg,
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.06)",
              }}
              aria-label={`${c.cta} — ${c.headline}`}
            >
              <div className="absolute inset-0 grid grid-cols-[1.15fr_1fr] gap-3 p-5 md:p-6">
                {/* ── Left: headline + CTA pill ── */}
                <div
                  className="flex flex-col justify-between"
                  style={{ color: c.textColor }}
                >
                  <h3
                    className="font-display font-extrabold leading-[1.08]"
                    style={{
                      fontSize: "clamp(20px, 4.8vw, 24px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {c.headline}
                  </h3>
                  <span
                    className="inline-flex w-fit items-center rounded-full px-4 py-2 font-body text-[13px] font-bold transition-transform duration-200 ease-glide group-hover:translate-x-1"
                    style={{
                      background: c.pillBg,
                      color: c.pillText,
                    }}
                  >
                    {c.cta}
                  </span>
                </div>

                {/* ── Right: photo ── */}
                <div className="relative overflow-hidden rounded-[14px]">
                  <Image
                    src={c.photo}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 44vw, 220px"
                    className="object-cover object-center transition-transform duration-500 ease-glide group-hover:scale-[1.06]"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionFrame>
    </Section>
  );
}
