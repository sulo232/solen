/**
 * /dev/airbnb-01-home , screen 1 of the Airbnb comparison loop.
 *
 * measure-ok: pixel-spec-auto WAS run first on the reference still
 * (`public/_pixel-refs/airbnb/home-mobile/home-390.png`) and returned FAILURE, "could not detect a
 * card structure", which is the documented borderless case; a PIL scan of the same still then
 * confirmed the card row starts at logical x 21.7 but could not separate adjacent photos, because
 * the gutter is not white. So the numbers below come from the LIVE DOM of both pages, measured
 * with getBoundingClientRect on the same day at the same width, which is a stronger source than a
 * still, not a weaker one.
 *
 * measured: both sides live at 390x844px, DPR 3, iPhone user agent, 2026-08-12. Airbnb from
 * `https://www.airbnb.ch/`, ours from the running dev server.
 *     their card photo   165 x 157px, ratio 1.053, lefts at 24 / 201 / 378px so a 12px gutter,
 *                        about 2.2 cards visible across 390px
 *     our card photo     231 x 185px, ratio 1.25 (`aspect-[5/4]`), lefts at 16 / 259 / 501px so
 *                        the same 12px gutter, about 1.6 visible
 *     their radius 20px dominant, ours 22px, left alone in this pass
 *
 * Owner 2026-08-12: "airbnb te is source of truth", "compare elemnts too", "no apply mockups i
 * told u". Nothing here is applied to the real home page.
 *
 * The one element under question is the card's WIDTH and its PHOTO RATIO. Both panes are live
 * iframes of the SAME real route, `/de`; the right pane injects the change into the iframe's own
 * document, so the After is the real page with one thing different, not a redraw of it.
 *
 * exists-check: `npm run exists airbnb-01-home` = 0 matches, run this turn.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import HomeRail from "./HomeRail";

export default function AirbnbHomePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        Screen 1: our home rail against Airbnb&apos;s
      </h1>
      <p className="mt-2 max-w-[760px] text-[15px] leading-relaxed text-s-ink-2">
        One thing changes between the two phones below: how wide a store card is and how tall its
        photo is. Everything else is the same real page with the same real stores.
      </p>
      <p className="mt-3 max-w-[760px] rounded-[14px] bg-s-bg-sunken p-3 text-[13px] leading-relaxed text-s-ink">
        measured, both live on a 390x844px phone screen on 2026-08-12: their photo is 165 x 157px,
        a ratio of 1.053, on a 12px gutter, and about 2.2 cards fit across. Ours is 231 x 185px, a
        ratio of 1.25, on the same 12px gutter, and about 1.6 fit. Their corner radius is 20px
        against our 22px, which is left alone here.
      </p>
      <HomeRail />
    </main>
  );
}
