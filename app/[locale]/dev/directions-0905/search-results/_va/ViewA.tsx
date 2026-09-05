/**
 * Grounded-in: app/[locale]/_components/search/SearchTemplate.tsx (the real component
 * this direction restructures, rendering the live results for a city/category: search
 * pill ~line 1306, result-count row ~line 1590, Sort pill ~line 1617, floating Map toggle
 * ~line 2196) and app/[locale]/_components/search/SalonResultCard.tsx (the real result
 * card, "feed" variant, imported below unmodified), both read in full before this file.
 *
 * exists-check: net-new vs lib/search-filter-pills.ts (a filter-group DATA config used by
 * two other, unrelated pages: it is not a rendered row and this file does not reuse or
 * reference its route names) and components/ui/card.tsx (a generic wrapper `Card`, not the
 * card anatomy this direction needs; the real anatomy comes from SalonResultCard.tsx,
 * imported below, unmodified). lib/min-price-service.ts is reused (not duplicated) by
 * data.ts. _tasks/SOLEN_DESIGN.md, _rules/SOLEN_PATTERNS.md, _plans/MOBILE_DESIGN_SYSTEM.md,
 * _plans/DESIGN_SYSTEM_HARDENING.md, _tasks/SEARCH_BOOK_POINTS_SPEC.md are planning/pattern
 * docs, not components; read for context, nothing in them names a pre-built Fresha-list
 * direction to extend.
 *
 * Direction A: "Fresha list". One column of Fresha-anatomy result cards.
 *
 * Depicts: search pill -> app/[locale]/_components/search/SearchTemplate.tsx ~line 1306
 *   (the "big search" pill, variant C, owner-picked 2026-08-10), reproduced statically
 *   (no scroll-shrink, no overlay open) at its real height/radius/shadow classes.
 * Depicts: result-count row -> app/[locale]/_components/search/SearchTemplate.tsx ~line
 *   1590 (the total/pluralSalons count paragraph), reproduced statically.
 * Depicts: Filters pill -> NET-NEW: no single "Filters" pill exists on the live component
 *   today (its filters render as a chip row per lib/search-filter-pills.ts on other
 *   routes); this is the Fresha single-modal-button structure this direction ports in,
 *   static and non-functional, per _design-system/references/fresha--search-results.md
 *   item 2 and its own Port map ("Filters" button + modal -> components-legacy/ui/
 *   FilterBar.tsx).
 * Depicts: Sort pill -> app/[locale]/_components/search/SearchTemplate.tsx ~line 1617
 *   (sortLabel/sortBtnRef), reproduced statically, no dropdown wired.
 * Depicts: result cards -> app/[locale]/_components/search/SalonResultCard.tsx, the REAL
 *   component, variant="feed" with hasServiceQuery=true (photo, name+rating, distance/
 *   address+category line, up to 3 real service-price rows, the "View N matching
 *   services" link), imported unmodified.
 * Depicts: floating Map pill -> app/[locale]/_components/search/SearchTemplate.tsx
 *   ~line 2196 (the real mobile map toggle button, same position/copy). Styled here as a
 *   NEUTRAL outline pill (border-s-border, white, ink text), not the live control's solid
 *   ink fill: this direction's own filter/sort pills sit directly above it in the same
 *   neutral family, and the design contract reserves solid ink fill for the ONE commit
 *   action per screen, which a list/map mode toggle is not. Logged as a builder concern,
 *   not silently ported.
 *
 * measure-ok: every number below is grounded in OUR OWN existing values, not eyeballed
 * off the reference. The search pill and Sort pill are copied VERBATIM from the live
 * classes at the SearchTemplate.tsx line numbers cited above (same height 64px, radius
 * 40px, padding, shadow-elevation-3 / border-s-border token names), so there is nothing to
 * re-measure, they are the real control's own numbers. The two net-new elements (the
 * Filters pill and the Map pill) are sized off our own existing Sort pill sitting directly
 * next to them (same min-h-[44px], same rounded-pill, same border-s-border, same
 * text-[13px]), not off Fresha's outline pill, which was never pixel-measured (Mobbin
 * desktop stills only, no computed styles per the spec file's own Identity section). Card
 * radius, shadow, type sizes, and gap-6 (24px, 4pt scale) all come from the real
 * SalonResultCard.tsx feed variant and Solen's own locked type scale, cited inline below,
 * not from Airbnb's 20px/flat-shadow numbers (those are logged as CONFLICTS, kept out).
 *
 * Anatomy per _design-system/references/fresha--search-results.md ("Measured" list,
 * item 4): photo (full card width, ~4:3/5:4) -> venue name (bold) -> star rating +
 * review count + neighborhood/city (grey, one line) -> up to three service rows
 * (name + duration left, price right) directly inside the card -> a closing text
 * link ("See more" in Fresha; "View N matching services" is the exact Solen copy
 * already shipped for this same anatomy, kept below). This maps 1:1 onto the real
 * `SalonResultCard` "feed" variant with `hasServiceQuery` true, so THE REAL CARD is
 * reused unmodified, not redrawn (FLOORS LAW 9: compose, don't hand-draw).
 *
 * Look (Airbnb finish) per _design-system/references/airbnb--look-recipe.md and
 * airbnb--search-results.md: card radius stays Solen's locked 16px (`rounded-card`,
 * conflict logged below, Airbnb measures 20px). CORRECTED after rendering and
 * measuring the actual DOM (not assumed from the "card"/"grid" variants): the real
 * "feed" variant's photo carries NO shadow and NO border at all (`bg-s-bg-sunken`
 * only), so it already matches Airbnb's flat card treatment with zero porting
 * needed, no shadow conflict on this variant. Spacing between cards uses the 4pt
 * scale (`gap-6` = 24px, inside Airbnb's own measured card-to-card range). Type
 * sizes measured live at 390x844: name 16px/500 (not 14, corrected after
 * measuring; the "feed" variant's own name element runs larger than the
 * grid/list variants' 14px), meta 12-13.5px. Hairline stays `#E4E4E7` (already
 * effectively identical to Airbnb's `#DDDDDD`, no change needed).
 *
 * Filter row per the Fresha spec item 2: a result-count line left, ONE outline
 * "Filters" pill right (Fresha's single-modal pattern, not a chip row), plus a
 * neutral Sort pill (Solen already ships sort as a pill on this exact route, kept
 * for continuity). CONFLICT [Fresha's fill on a chosen "Venue type" option is solid
 * purple]: kept the locked neutral grey fill instead, never Fresha's purple, per
 * the design contract's filter-pill row and the spec's own conflict note. Static:
 * no modal, no interaction wiring, this is a structure-and-finish mockup, not a
 * functional filter.
 *
 * Conflicts kept (locks over the reference), all logged in the two spec files
 * above and honoured here without change: card radius 16px not Airbnb's 20px;
 * every pill's chosen-option fill stays the locked neutral grey, never Fresha's
 * purple or a saturated accent. No shadow conflict on this variant (measured:
 * the real "feed" variant photo is already flat, see the Look note above).
 * Additional builder concern: the live map toggle button ships filled with the
 * ink token; this direction renders it as a neutral outline pill instead (see
 * the Depicts line above), which is a real visual difference from the shipped
 * control worth the orchestrator's attention.
 *
 * MEASURED SIZE-BUDGET FINDING (390x844, first viewport + rendered cards): 5
 * distinct font sizes appear (12, 13, 13.5, 14, 16px), one over the design
 * contract's <=4-size ceiling. All five originate inside the REAL, unmodified
 * SalonResultCard.tsx "feed" variant itself (16 name, 14 rating/review-count,
 * 13 address/category lines, 13.5 service name+price, 12 duration sub-line),
 * present even before this direction's own added chrome (search/count/filter/
 * sort/map, which reuse the 13/14/16 sizes already in the card, adding none
 * new). That file is off-limits (read-only) to this builder; the fix, if
 * wanted, is a size collapse inside SalonResultCard.tsx's feed variant, not
 * something this direction can change while reusing the real component.
 * Weights measured: 400 and 500 only (2, within the <=2-weight ceiling).
 *
 * floors: (a) photo focal - every card's photo is 5/4 aspect, the largest element
 * per card; (b) one biggest element - the salon name (16px/700 via CardName) is the
 * clear anchor per card, no competing size; (c) real number - real prices (CHF),
 * real review counts, real durations, nothing fabricated; (d) semantic colour -
 * the star rating (#FFC32B) on every card with a rating; (e) no dead-grey zone -
 * every card carries a real photo plus a sunken-tray service-row block; (f)
 * worst-case content - CardName truncates, service names truncate, address line
 * truncates, so a maximally long real name/service does not break the layout.
 */
import { Search, SlidersHorizontal, ChevronDown, Map as MapIcon } from "lucide-react";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";
import type { SearchResultsData } from "./data";

interface ViewAProps {
  data: SearchResultsData;
  locale: string;
}

export function ViewA({ data, locale }: ViewAProps) {
  const { salons, total, cityName } = data;

  return (
    <div className="min-h-dvh bg-white pb-32">
      {/* Search pill - the page's own search entry point (SearchTemplate's "big
          search" control), reproduced statically at its real size/radius/shadow.
          Not global chrome: this lives inside the page body on every direction of
          this surface, same as the live /en/basel/coiffeur route. */}
      <div className="mx-auto w-full max-w-[680px] px-4 pt-3">
        <div className="flex h-[64px] w-full items-center justify-center gap-2 rounded-[40px] border border-s-border bg-white px-[19px] text-center shadow-elevation-3">
          <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" />
          <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink">
            {data.categorySlug === "coiffeur" ? "Hair Salon" : data.categorySlug}
            {cityName ? ` in ${cityName}` : ""}
          </span>
        </div>
      </div>

      {/* Result count + Filters + Sort row - Fresha spec item 2 (count left, one
          outline Filters pill right), Solen's own Sort pill kept alongside for
          continuity with the live page. Neutral pills only, no blue (design
          contract "filter pill" row). */}
      <div className="mx-auto flex w-full max-w-[680px] items-center justify-between gap-3 px-4 pt-5">
        <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-s-ink">
          <span className="tabular-nums">{total}</span> salons{cityName ? ` in ${cityName}` : ""}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-s-border bg-white px-3 py-1.5 font-body text-[13px] font-medium text-s-ink"
          >
            <SlidersHorizontal size={13} strokeWidth={2.25} aria-hidden />
            Filters
          </button>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-s-border bg-white px-3 py-1.5 font-body text-[13px] font-medium text-s-ink"
          >
            Recommended
            <ChevronDown size={13} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>

      {/* One column, Fresha order: photo -> name+rating -> distance/address+category -> up
          to 3 service rows w/ prices -> the closing link. Real SalonResultCard, feed
          variant, hasServiceQuery true. gap-6 (24px, 4pt scale) between cards. */}
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6 px-4 pt-6">
        {salons.map((s, i) => (
          <SalonResultCard
            key={s.id}
            variant="feed"
            slug={s.slug}
            name={s.name}
            locale={locale}
            rating={s.averageRating}
            photoUrl={s.photoUrl ?? undefined}
            galleryCount={s.galleryCount}
            hasServiceQuery
            category={s.category}
            address={s.address}
            city={s.cityName ?? undefined}
            priceFromCHF={s.priceFromCHF}
            priceFromService={s.priceFromService}
            reviewCount={s.reviewCount}
            services={s.services}
            salonId={s.id}
            priority={i === 0}
          />
        ))}
      </div>

      {/* Map entry point (FIXED requirement), static: a neutral outline pill (see the
          Depicts note above for why this diverges from the live control's fill). */}
      <div className="fixed bottom-[86px] left-1/2 z-40 -translate-x-1/2">
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-s-border bg-white px-[18px] py-[11px] font-body text-[13px] font-medium text-s-ink shadow-elevation-3"
        >
          <MapIcon size={16} strokeWidth={1.9} aria-hidden />
          Map
        </button>
      </div>
    </div>
  );
}
