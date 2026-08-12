/**
 * /dev/mock/salon-reviews , a MOCKUP, in the sense the word now has.
 *
 * Owner 2026-08-12 rejected three comparison pages and a findings list, all of which I had called
 * mockups: "that is not a fucking mock. No. Refine the definition of a mock up". The definition now
 * sits at the top of `public/_mockups/_BASE.md` and a Stop gate enforces it.
 *
 * So this page is a SCREEN and nothing else: full-bleed, one screen, silent, the real route, before
 * and after on a toggle. No wrapper, no headings, no paragraphs, no numbers. Everything that would
 * have been prose is in the commit message and in `_plans/AIRBNB_UI_LOOP_2026-08-12.md`.
 *
 * lang-ok: the screen is the real German page rendered through i18n; the only string this route
 * owns is the toggle label, in English.
 *
 * measure-ok: the change shown is the council's live measurement of Airbnb's own listing on
 * 2026-08-12 against ours, quoted in the component beside this.
 *
 * exists-check: `npm run exists "mock salon reviews"` = 0 matches, run this turn.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import Screen from "./Screen";

export default function MockSalonReviewsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Screen />;
}
