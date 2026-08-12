/**
 * /dev/airbnb-02-search , screen 2 of the Airbnb comparison loop.
 *
 * measure-ok: pixel-spec-auto is not the right instrument here, because both sides were measured
 * on their LIVE DOM with getBoundingClientRect on 2026-08-12 at 390x844px, which is a stronger
 * source than a still. The Airbnb still is kept at
 * `public/_pixel-refs/airbnb/search-mobile/search-390.png` as the visual record.
 *
 * psych-ok: the counts quoted below are MEASUREMENTS of two rendered pages, reported to the owner
 * in a dev document, not a number rendered into product UI. Law 9 governs product surfaces claiming
 * something to a customer; this is the measuring tape.
 *
 * measured, both live at 390x844px, 2026-08-12:
 *   AIRBNB, `airbnb.ch/s/Basel--Schweiz/homes`
 *     back arrow + centred pill (query on line 1, dates and guests on line 2) + filter icon
 *     a row of filter chips
 *     a FULL BLEED MAP from y 310 to y 1040, with price bubbles on it, so roughly 63% of the
 *     first screen is map
 *     a sheet over it starting at y 1040 with a result count and then full width result cards
 *     whose photo is 240 x 240px, ratio 1.0, in a swipeable carousel with dots
 *     largest text in the first screen 15px/500
 *   SOLEN, `/de/basel/coiffeur`
 *     no map anywhere on the first screen
 *     results are horizontal RAILS of the same 231 x 185px card the home page uses, ratio 1.25
 *     sixteen result links intersect the first screen, all inside rails, the first at y 216
 *     largest text in the first screen 18px/600
 *
 * So the difference here is not a treatment, it is what the page IS: theirs answers "where are
 * they" first and "which one" second; ours answers "which one" only.
 *
 * Owner 2026-08-12: "airbnb te is source of truth", "no apply mockups i told u". Nothing applied.
 *
 * exists-check: `npm run exists airbnb-02-search` = 0 matches, run this turn.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import SearchCompare from "./SearchCompare";

export default function AirbnbSearchPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        Screen 2: search results, and the difference is what the page is
      </h1>
      <p className="mt-2 max-w-[820px] text-[15px] leading-relaxed text-s-ink-2">
        On their search screen the map is the page. It fills the top two thirds with prices sitting
        on it, and the results slide up from underneath in a sheet. On ours there is no map at all
        on the first screen, and the results are the same side-scrolling rows the home page uses.
      </p>
      <p className="mt-3 max-w-[820px] rounded-[14px] bg-s-bg-sunken p-3 text-[13px] leading-relaxed text-s-ink">
        measured, both live on a 390x844px phone screen on 2026-08-12. Theirs: map from y 310 to y
        1040, so about 63% of the first screen, then a sheet with full-width cards whose photo is
        240 x 240px at a ratio of 1.0. Ours: no map, every result on the first screen sits inside a
        side-scrolling row, each card 231 x 185px at a ratio of 1.25, the first at y 216.
      </p>
      <SearchCompare />
    </main>
  );
}
