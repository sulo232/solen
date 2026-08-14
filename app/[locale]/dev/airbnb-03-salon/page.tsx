/**
 * /dev/airbnb-03-salon , screen 3 of the Airbnb comparison loop, built from the two strongest
 * findings the wide council produced for the salon page.
 *
 * measure-ok: both sides measured live at 390x844px on 2026-08-12 by the council run
 * `wf_0f33d9f6-bfc`, cross-checked on two different Airbnb listings. Numbers reproduced from its
 * structured output, not retyped.
 *   THEIRS  review body 14px / 400 / rgb(34,34,34), reviewer name 12px / 500 / rgb(34,34,34).
 *           The body is one size step LARGER than the name and both carry the page ink; only the
 *           metadata under the name is greyed.
 *   OURS    review body 15px / 400 / rgb(107,107,107) at `SalonReviews.tsx:302`, reviewer name
 *           16px / 600 / rgb(10,10,10) at `SalonReviews.tsx:279`. The name is larger AND heavier,
 *           and the body is the only one of the three demoted to grey.
 *
 * Owner 2026-08-12: "airbnb te is source of truth", "no apply mockups i told u". Nothing applied.
 *
 * exists-check: `npm run exists airbnb-03-salon` = 0 matches, run this turn. Screens 1 and 2 live
 * at /dev/airbnb-01-home and /dev/airbnb-02-search and cover different surfaces; the full findings
 * list is at /dev/airbnb-findings.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import SalonCompare from "./SalonCompare";

export default function AirbnbSalonPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        Screen 3: the reviews on a salon page
      </h1>
      <p className="mt-2 max-w-[820px] text-[15px] leading-relaxed text-s-ink-2">
        What a customer came to read is set in the grey we use for timestamps, and the reviewer&apos;s
        name is the largest, heaviest thing in the card. Airbnb ranks it the other way round.
      </p>
      <p className="mt-3 max-w-[820px] rounded-[14px] bg-s-bg-sunken p-3 text-[13px] leading-relaxed text-s-ink">
        measured on both, live, on a 390x844px phone screen on 2026-08-12, and checked on two
        different Airbnb listings. Theirs: the review text is 14px in the page black, the name is
        12px, so the words are a size bigger than the byline and both are black. Ours: the review
        text is 15px in grey rgb(107,107,107), the name is 16px semibold in black rgb(10,10,10).
      </p>
      <SalonCompare />
    </main>
  );
}
