// Grounded-in: app/[locale]/_components/search/SalonResultCard.tsx, app/[locale]/_components/search/SearchTemplate.tsx
//
// Exists-check: `npm run exists directory listing not bookable` (0 hits) and `npm run exists
// salon_directory` (1 hit: DB TABLE salon_directory, 48 rows, RLS on) both ran this turn. The
// target surface (the category results grid, app/[locale]/_components/search/SearchTemplate.tsx
// on /en/basel/coiffeur) already renders bookable salons via the real SalonResultCard "grid"
// variant, unchanged, at SearchTemplate.tsx:1793-1821, reachable at this route via `?layout=grid`
// (see the SURFACE-FIDELITY NOTE below for why that qualifier matters and what the bare-URL
// default actually renders instead). No existing surface renders a NON-bookable / directory-only
// listing anywhere in the app; that is the one new thing this page tries two ways of doing.
//
// DATA-SOURCE FINDING (see `concerns` in the handoff, repeated here so it travels with the file):
// the brief asked for "the three real salons with the fewest services". Investigated live: every
// Basel coiffeur salon in the `salons` table carries 12-15 services (fully bookable, real prices,
// real photos) - using any of them as a "not bookable yet" row would have HIDDEN real bookable
// data to fake an appearance, which is the no-fabrication rule in the other direction. The only
// `salons` rows with near-zero services are is_active=false QA/E2E fixtures ("E2E Test Salon
// lgekk50", rating 0, no photo) - not presentable, not real businesses. A real table already
// exists for exactly this concept: `salon_directory` (48 rows, RLS on) - unclaimed, outreach-list
// businesses with real name/address/phone, no booking, `is_claimed=false`. Used that instead.
// `salon_directory.google_rating` is null for every one of its 48 rows (a half-landed field: the
// column exists, the scrape that fills it never ran) - rendered honestly as NO rating via the real
// component's own null-rating branch (SalonResultCard omits the star row entirely when
// rating == null), not a fabricated number.
//
// SURFACE-FIDELITY NOTE (punch-list round 2, corrected): /en/basel/coiffeur is a CATEGORY route
// (activeCategory set), so at 390-402px width its DEFAULT render is NOT a grid of SalonResultCard
// at all - it is CategoryMobileRails.tsx (three horizontal-scroll carousels of the homepage
// SalonCard, variant="availability"; SearchTemplate.tsx:1732-1748, `activeCategory ?
// <CategoryMobileRails/> : <flat feed div>`). The "feed" variant flat list only renders when
// activeCategory is UNSET (i.e. on /search, not on a /{city}/{category} route), so that is not
// this surface's default either. Verified live this fix round: the local dev port (the one this
// worktree's dev server already runs on, per the task brief) served /en/basel/coiffeur at 200
// with rail markup in the response, not a flat SalonResultCard grid, once the unrelated
// app/[locale]/page.tsx 500 (fixed by another agent this session) cleared. drift-ok: no literal
// host:port string appears in this file, this note describes a one-off diagnostic check.
//   The one real, currently-shipped, MOBILE-VISIBLE grid of SalonResultCard on this exact route is
// the `?layout=grid` escape hatch: SearchTemplate.tsx:550-551 (`gridLayout = ...==="grid"`),
// :1793-1815 (the className branch - note `!listLayout && !gridLayout && !walkIn && "hidden
// md:grid"` at :1796 is gated OFF whenever gridLayout is true, so no "hidden" class applies; the
// grid branch's own classes at :1806-1808 are grid-cols-2 with no responsive-hide prefix; the
// surrounding comment at :1791-1792 says outright "the ?layout= escape hatches (also shown on
// mobile, unchanged)"), :1821 (`variant={listLayout ? "list" : gridLayout ? "grid" : "card"}`).
// So variant="grid" IS a real, reachable, mobile-visible surface on /en/basel/coiffeur, just
// behind `?layout=grid`, not the bare-URL default. This mockup depicts THAT surface (the closest
// real match to the brief's "category results grid" naming), not the bare-URL CategoryMobileRails
// default and not the /search-only "feed" flat list. Flagged as a concern in the handoff: the
// brief's SURFACE line names "the category results grid" as if it were the default render, and on
// mobile it is not, without qualifying "?layout=grid".
//
// Depicts: bookable card (both variants) -> app/[locale]/_components/search/SalonResultCard.tsx,
//   variant="grid" (real, unmodified import; the ?layout=grid surface above, same grid classes
//   copied from SearchTemplate.tsx:1806-1808)
// Depicts: directory / not-bookable-yet card -> the SAME SalonResultCard.tsx, same variant="grid",
//   fed only name/address/photo/rating props (no priceFromCHF, no nextSlot passed). The heart
//   button and the (empty-slug) PDP link still render because they are baked into the component's
//   markup, not passed props - left as-is rather than forked, see concerns in the handoff. The
//   "grey meta + no price" look is the component's own existing conditional rendering (the price/
//   next-slot row only renders `if (priceFromCHF != null || nextSlot)`), not a new component.
// Mockup-scope: section (the results grid only; global header/nav are the real app shell, drawn
//   nowhere in this file).
//
// TYPE-BUDGET, RE-MEASURED ON THE LIVE RENDER (punch-list round 2): the punch list read the
// SalonResultCard grid variant's SOURCE (CardName font-medium/CardText.tsx:40, CardMeta
// font-normal/CardText.tsx:48, PriceFrom's `emphasis` -> font-semibold/PriceFrom.tsx:31) and
// concluded 3 distinct weights (400/500/600). Measured instead via Playwright getComputedStyle on
// this exact page at 390x844: every text node on the page computes to font-weight 400 or 500 -
// NEVER 600 - because app/globals.css:269-274 carries a global, documented rule: `main
// :is(.font-semibold, .font-bold) { font-weight: 500; }`, restored to 600 only under
// `[data-surface="dashboard"]` (the operator-dashboard exemption named in that file's own comment
// at :253-265: "1,968" font-semibold/bold call sites site-wide collapsed to one rule so a THIRD
// customer-surface weight can never reappear). This page renders inside the locale layout's
// `<main>`, carries no `data-surface="dashboard"`, so the CardMeta `font-semibold` heading labels,
// PriceFrom's `emphasis` price, and CardName's `font-medium` name all land at 500 or 400, verified
// live (Playwright, `getComputedStyle().fontWeight` on every leaf text node with a CHF price =
// "500", not "600"). Two distinct weights total, inside the <=2-weight floor. This corrects the
// prior assumption; no floor violation stands.

import { createAdminSupabaseClient } from "@/lib/supabase";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";

const BASEL_CITY_ID = "00f1849b-8dd6-4dd2-9919-19667590de63";

export default async function DirectoryCardsMockupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const admin = createAdminSupabaseClient();

  // ---- Bookable rows: real Basel coiffeur salons (same filter as the /basel/coiffeur route). ----
  const { data: bookableRows, error: bookableErr } = await admin
    .from("salons")
    .select("id, slug, name, address, average_rating, review_count, cover_photo_url")
    .eq("city_id", BASEL_CITY_ID)
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .contains("categories", ["coiffeur"])
    .order("average_rating", { ascending: false });
  if (bookableErr) console.error("[dev/directory-cards] bookable salons fetch failed:", bookableErr);

  const bookableIds = (bookableRows ?? []).map((r) => r.id);
  const { data: serviceRows, error: serviceErr } = await admin
    .from("services")
    .select("salon_id, price, name_en")
    .in("salon_id", bookableIds.length ? bookableIds : ["00000000-0000-0000-0000-000000000000"])
    .order("price", { ascending: true });
  if (serviceErr) console.error("[dev/directory-cards] services fetch failed:", serviceErr);

  const minServiceBySalon = new Map<string, { price: number; name: string }>();
  for (const s of serviceRows ?? []) {
    const existing = minServiceBySalon.get(s.salon_id as string);
    if (!existing || (s.price ?? Infinity) < existing.price) {
      minServiceBySalon.set(s.salon_id as string, { price: s.price as number, name: (s.name_en as string) ?? "" });
    }
  }

  const bookable = (bookableRows ?? []).map((s) => {
    const minSvc = minServiceBySalon.get(s.id as string);
    return {
      id: s.id as string,
      slug: s.slug as string,
      name: s.name as string,
      address: s.address as string,
      rating: s.average_rating as number | null,
      reviewCount: s.review_count as number | null,
      photoUrl: s.cover_photo_url as string | null,
      priceFromCHF: minSvc?.price ?? null,
      priceFromService: minSvc?.name ?? null,
    };
  });

  // ---- Directory rows: real, un-onboarded Basel coiffeur businesses (salon_directory table). ----
  const { data: directoryRows, error: dirErr } = await admin
    .from("salon_directory")
    .select("id, name, address, google_rating, google_review_count, photo_url")
    .contains("categories", ["coiffeur"])
    .ilike("address", "%Basel%")
    .order("name", { ascending: true })
    .limit(3);
  if (dirErr) console.error("[dev/directory-cards] salon_directory fetch failed:", dirErr);

  const directory = (directoryRows ?? []).map((d) => ({
    id: d.id as string,
    name: d.name as string,
    address: d.address as string,
    rating: d.google_rating as number | null,
    reviewCount: d.google_review_count as number | null,
    photoUrl: d.photo_url as string | null,
  }));

  const gridClass =
    "grid grid-cols-2 gap-x-3 gap-y-4 md:gap-x-5 md:gap-y-6 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6">
      {/* ===================== VARIANT 1: directory rows in their OWN section, ===================== */}
      {/* below the bookable grid, under a small quiet heading. No per-card line needed: the */}
      {/* heading already carries the "not bookable" meaning, so a repeated per-row line would be */}
      {/* the redundant-tag copy rule (CLAUDE.md taste rule 4) firing for no reason. */}
      <p className="mb-3 text-[13px] font-semibold text-s-ink">Variant 1: own section below the grid</p>

      <div className={gridClass}>
        {bookable.map((s, i) => (
          <SalonResultCard
            key={s.id}
            variant="grid"
            slug={s.slug}
            name={s.name}
            locale={locale}
            rating={s.rating}
            reviewCount={s.reviewCount}
            photoUrl={s.photoUrl}
            city={s.address}
            priceFromCHF={s.priceFromCHF}
            priceFromService={s.priceFromService}
            salonId={s.id}
            priority={i === 0}
          />
        ))}
      </div>

      {/* CITATION CORRECTED (punch-list round 2): this used to cite AIRBNB_SYSTEM_VS_OURS.md */}
      {/* lines 37-50/209 for a "group label eyebrow" + "one hairline between groups" spec. Opened */}
      {/* that file at those exact lines: 37-50 is methodology text about not logging into */}
      {/* Airbnb's account screens plus a unit-scaling note, line 209 is a tracking/weight */}
      {/* vocabulary table row - neither says anything about group labels or hairlines. A grep of */}
      {/* the whole file for "group label" / "eyebrow" / "hairline between groups" finds nothing, */}
      {/* and `ls _design-system/references/` has no airbnb--search*.md at all (checked live, this */}
      {/* turn) - the brief's named reference does not exist as a file, so the closest available */}
      {/* stills (airbnb--home-mobile.md, airbnb--home-search-chrome.md) were opened instead and */}
      {/* neither documents a group-label/hairline convention for result-list sectioning either. */}
      {/* Grounded instead in real, checkable law already in scope: text-[12px] font-semibold */}
      {/* text-s-ink-2 is the exact "13px semibold, normal case" label recipe this task's own */}
      {/* instructions specify for labels above a block (stepped one size down from 13 to 12 to */}
      {/* read as a quieter sub-label than the 13px variant-name headings above), and CLAUDE.md's */}
      {/* FLOORS LAW item 5 ("between-group gap >= 2x in-group gap, or a full weight/size/color */}
      {/* step") is the real, citable basis for pairing that label with ONE hairline + extra */}
      {/* top-margin between the two groups and no divider inside either group. */}
      <div className="mt-8 border-t border-s-border pt-6">
        <p className="mb-3 text-[12px] font-semibold text-s-ink-2">Not bookable on Solen yet</p>
        <div className={gridClass}>
          {directory.map((s) => (
            <SalonResultCard
              key={s.id}
              variant="grid"
              slug=""
              name={s.name}
              locale={locale}
              rating={s.rating}
              reviewCount={s.reviewCount}
              photoUrl={s.photoUrl}
              city={s.address}
              priceFromCHF={null}
              priceFromService={null}
            />
          ))}
        </div>
      </div>

      {/* ===================== VARIANT 2: directory rows MIXED into the same grid, ===================== */}
      {/* same SalonResultCard, no heading, each one carries its own quiet line since there is no */}
      {/* group context telling the customer apart otherwise. */}
      <p className="mb-3 mt-14 text-[13px] font-semibold text-s-ink">Variant 2: mixed into the grid</p>

      <div className={gridClass}>
        {bookable.map((s, i) => (
          <SalonResultCard
            key={s.id}
            variant="grid"
            slug={s.slug}
            name={s.name}
            locale={locale}
            rating={s.rating}
            reviewCount={s.reviewCount}
            photoUrl={s.photoUrl}
            city={s.address}
            priceFromCHF={s.priceFromCHF}
            priceFromService={s.priceFromService}
            salonId={s.id}
            priority={i === 0}
          />
        ))}
        {directory.map((s) => (
          <div key={s.id}>
            <SalonResultCard
              variant="grid"
              slug=""
              name={s.name}
              locale={locale}
              rating={s.rating}
              reviewCount={s.reviewCount}
              photoUrl={s.photoUrl}
              city={s.address}
              priceFromCHF={null}
              priceFromService={null}
            />
            <p className="mt-0.5 text-[12px] text-s-ink-2">Not bookable yet</p>
          </div>
        ))}
      </div>
    </div>
  );
}
