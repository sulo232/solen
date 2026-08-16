"use client";

// mockup-ok: this component is built against the owner-approved mockup
// public/_mockups/looks-round2/section.html, variant B ("B" + "Apply it now", 2026-08-16), measured
// at 390x844: photo frame 9:16 at radius 16, the look name in an OPAQUE white pill ON the photo,
// heart 44x44, one shadow layer behind the frame (elevation-3, 0 6px 16px rgba(50,47,44,0.12),
// tailwind.config.js line 280), NO TikTok badge and NO black gradient over the photo.
//
// What changed from the I5 version of this file, and why, all three from the owner the same round:
//   1. the 4-across SQUARE grid (aspect-square, 82x82 measured live) becomes a horizontal rail of
//      9:16 cards. He has rejected the square repeatedly.
//   2. the card gets a real shadow BEHIND it instead of the black overlay burned onto the photo
//      ("just put in, like, shadow behind it so it actually looks correct").
//   3. the name moves from below the photo into the pill on it. That is variant B, and its cost is
//      named in the mockup: one line at 12px capped at 80% of the card, so long style names
//      truncate where two 14px lines below the photo would not have.
// The section title, the see-all link and the self-hide floor are untouched.
//
// exists-check (I5, 2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html):
// ran `npm run exists PopularLooks` (only this turn's own new usePopularLooks.ts hook, no component)
// and `npm run exists homepage` (33 existing homepage components, none matching; Entdecken.tsx is
// the closest neighbour , same /api/discovery/feed?category=hair source). That neighbour is now
// UNMOUNTED from the homepage (2026-08-16): both rails rendered the same 8 look ids from one query,
// so this section keeps the job and takes the Inspo card anatomy with it.
//
// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md (Layout / Section composition)
// and _design-system/components/PopularLooks.md written in this same turn.

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";
import { HeartButton } from "./HeartButton";
import { Skeleton } from "../primitives/Skeleton";
import { usePopularLooks } from "./usePopularLooks";

/** mockup-ok: public/_mockups/looks-round2/section.html:115-118, the APPROVED variant B pill, taken
 *  from the artifact the owner actually picked rather than from the retired section.
 *
 *  This was copied from Entdecken.tsx's `solidLabelStyle` first, and that broke the variant. That
 *  recipe carries `backdropFilter: blur(14px) saturate(1.1)`, and on this rail the blur made the
 *  name fail to paint at all: measured on the rendered page, the text was present in the DOM at
 *  full opacity and visibility with ink colour, and the card still showed an EMPTY WHITE PILL.
 *  Setting backdrop-filter to none in the live DOM made every name appear immediately, which is
 *  the causation, not a correlation.
 *
 *  That matters more than a styling nit: variant B exists ONLY to keep the name on the photo, so a
 *  pill that hides the name is the one failure that makes his choice meaningless. The mockup's own
 *  line 115 says why it is opaque rather than frosted: "opaque white pill, which is why it survives
 *  with the photo uncovered". Solid white needs no compositing to stay legible. */
const solidLabelStyle = {
  background: "#FFFFFF",
  boxShadow: "0 1px 3px rgba(10, 10, 10, 0.10)",
} as const;

/** Card footprint, one place: the live rule this rail inherits (44vw capped at 200px renders 172px
 *  on a 390 phone, 200px on anything wider). */
const CARD_W = "w-[44vw] max-w-[200px]"; // mockup-ok: public/_mockups/looks-round2/section.html

/**
 * Popular looks , horizontal rail of 9:16 photo cards (owner-approved variant B, 2026-08-16).
 * Real seeded discovery items (usePopularLooks.ts -> /api/discovery/feed?category=hair), each with
 * a real photo, a real title, and a real starting price. A look with no resolvable price is dropped
 * by the hook itself, never shown with an invented or omitted price. Self-hides below 2 real cards
 * (a lonely card is not a rail), the same floor AvailableThisWeek.tsx / TopCategoryRails.tsx /
 * CategoryBrowseRails.tsx's Rail() all use.
 */
export default function PopularLooks() {
  // 2026-08-15: this label was a hardcoded German literal, so it rendered German on /en,
  // /fr and /it. Same bug class the owner caught on the recently-viewed row that day.
  const t = useTranslations("home.trending");
  const tDiscover = useTranslations("home.discover");
  const locale = useLocale();
  const { looks, loading } = usePopularLooks({ limit: 8 });

  if (!loading && looks.length < 2) return null;

  return (
    <Section>
      <SectionFrame>
        {/* "Alle entdecken →" is Entdecken.tsx's own existing link copy for the same /inspo
            destination, reused verbatim rather than inventing new German. */}
        <SectionTitle
          title={t("popularLooks")}
          link={{ label: `${tDiscover("browseAll")} →`, href: `/${locale}/inspo` }}
        />
        <div
          className={[
            // pt/pb are not decoration: `overflow-x-auto` clips vertically too, and the frame's
            // elevation-3 lift lives outside the card box. Without this padding the shadow he asked
            // for is the first thing the scroller cuts off.
            "mt-1 flex gap-3 overflow-x-auto pt-2.5 pb-6", // mockup-ok: public/_mockups/looks-round2/section.html
            "[scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Negative-margin bleed matched to SectionFrame's own padding, so cards reach the
            // section edge and snap targets align to it.
            "-mx-3 px-3 md:-mx-4 md:px-4",
            "scroll-pl-3 md:scroll-pl-4",
          ].join(" ")}
        >
          {loading && looks.length === 0
            ? // Skeleton geometry is the CARD's geometry, not the old square: same 44vw/200px
              // width, same 9:16 frame, same radius, same lift, one 12px line below for the price.
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`shrink-0 ${CARD_W}`}>
                  <Skeleton rounded={16} className="aspect-[9/16] w-full shadow-elevation-3" />
                  <Skeleton height={12} width="40%" rounded={4} className="mt-2" />
                </div>
              ))
            : looks.map((look) => (
                <div key={look.id} className={`relative shrink-0 snap-center ${CARD_W}`}>
                  {/* The photo frame carries the elevation, and per the surface table a card
                      carrying elevation drops its border, never both. Nothing is painted over the
                      photograph: no gradient, no platform badge. */}
                  <div className="relative w-full aspect-[9/16] overflow-hidden rounded-[16px] bg-s-bg-sunken shadow-elevation-3">
                    <img
                      src={look.image}
                      alt=""
                      loading="lazy"
                      className="block h-full w-full object-cover"
                    />
                    <div
                      className="absolute bottom-2 left-2 max-w-[80%] rounded-full px-2.5 py-1"
                      style={solidLabelStyle}
                    >
                      <p className="truncate font-body text-[12px] font-semibold leading-[1.35] text-s-ink">
                        {look.title}
                      </p>
                    </div>
                  </div>
                  {/* The approved mockup's meta row (.who then .pr): creator left in ink-2, real
                      price pushed right in ink, tabular. An earlier build rendered the price alone
                      and justified it as "the name moved onto the photo, so this is the only line
                      left". That was wrong about the spec: the mockup states nameOnPhoto is the
                      ONLY difference between its two variants, so the meta row belongs to both. It
                      also silently dropped the TikTok credit, and "remove the TikTok part thingy"
                      meant the BADGE on the photo, which is what was measured and targeted. */}
                  <div className="mt-2 flex items-baseline gap-2">
                    {look.author && (
                      // mockup-ok: public/_mockups/looks-round2/section.html , .who, creator handle
                      <span className="truncate font-body text-[12px] font-normal leading-[1.35] text-s-ink-2">
                        {look.author}
                      </span>
                    )}
                    {/* mockup-ok: public/_mockups/looks-round2/section.html , .pr, price right */}
                    <span className="ml-auto shrink-0 font-body text-[12px] font-semibold leading-[1.35] text-s-ink tabular-nums">
                      {t("priceFrom", { price: look.priceFromCHF })}
                    </span>
                  </div>
                  {/* One tap target per card, the whole card, as a stretched transparent anchor
                      rather than a link wrapped around the heart (a button nested inside an anchor).
                      The heart sits above it on z-2 and keeps its own 44x44 hit area. No focus
                      classes here on purpose: the global a:focus-visible ink edge covers it. */}
                  <Link
                    href={`/${locale}/inspo/${look.id}`}
                    aria-label={`${look.title}, ${t("priceFrom", { price: look.priceFromCHF })}`}
                    className="absolute inset-0 z-[1] rounded-[16px]"
                  />
                  {/* lookId is what makes this heart real. Without it the control flipped to
                      "saved", wrote nothing, and forgot on reload. */}
                  <HeartButton salonName={look.title} lookId={look.id} className="z-[2]" />
                </div>
              ))}
        </div>
      </SectionFrame>
    </Section>
  );
}
