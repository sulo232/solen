"use client";

// exists-check: `npm run exists "mock salon reviews"` = 0. This composes the REAL `SalonReviews`
// component rather than drawing a second one, which FLOORS LAW 9 requires and which is also the
// only way the mockup can be trusted: what you see is the component that ships.
//
// WHY IT NO LONGER FRAMES THE SALON PAGE, written down because this was the fourth attempt.
// Framing `/de/salon/<slug>` and holding its scroll on the reviews produced a screen with the star
// row, the filter chips, and then nothing: the review cards never mount inside the frame. Measured
// standalone, that section is 858px tall at document y 1591; inside the frame it collapses to the
// header and chips alone. The cards mount lazily as the section comes into view, and a frame
// scrolled programmatically does not trigger that. Three earlier variants (hash anchor,
// scroll-into-view, a tall translated frame) each failed differently, the tall one by rearranging
// the page entirely because that page sizes blocks against the viewport.
//
// So the mockup renders the component directly. `SalonReviews` fetches its own reviews when given a
// salonId and an empty list, which is its own documented behaviour, so the data is live and nothing
// is faked.
//
// lang-ok: the component renders German through i18n; the only string this file owns is the toggle.
//
// measure-ok: the two values the toggle switches between are the council's live measurement of
// Airbnb's own listing on 2026-08-12 (review body 14px in the page ink, the name one step smaller
// at weight 500) against ours at SalonReviews.tsx:302 (15px, rgb(107,107,107)) and :279 (16px,
// weight 600).

import * as React from "react";
import { SalonReviews } from "@/app/[locale]/_components/salon/SalonReviews";

// Read off the live API this turn, not typed from memory.
const SALON = {
  id: "5784b1ab-7314-437a-a608-01a729f02cdd",
  slug: "cuts-and-culture",
  name: "Cuts & Culture",
  average: 4.81,
  count: 16,
};

const PROPOSED = `
  [class*="prose-measure"][class*="text-[15px]"] { font-size: 14px !important; color: rgb(10,10,10) !important; }
  [class*="text-[16px]"][class*="font-semibold"] { font-size: 14px !important; font-weight: 500 !important; }
`;

export default function Screen() {
  const [after, setAfter] = React.useState(true);

  return (
    <div className="fixed inset-0 z-[1001] overflow-y-auto bg-white">
      {/* The app's header, newsletter and footer are painted OVER this panel, not under it:
          covering them with a high z-index did not work because a transformed ancestor traps the
          stacking context. Measured symptom: the review cards sat at y 288 in the DOM while the
          newsletter was drawn from y 330 down. So they are hidden outright rather than covered.
          A mockup is judged by looking at it, and anything that is not the screen is noise. */}
      <style>{`
        body > header, header[class*="sticky"], footer, [class*="fixed"][class*="bottom-"]:not([data-mock-toggle]) { display: none !important; }
        main > section:has(input[type="email"]) { display: none !important; }
      `}</style>
      {after ? <style>{PROPOSED}</style> : null}

      <div className="px-4 pb-28 pt-6">
        <SalonReviews
          average={SALON.average}
          count={SALON.count}
          reviews={[]}
          salonId={SALON.id}
          salonSlug={SALON.slug}
          salonName={SALON.name}
          locale="de"
        />
      </div>

      <button
        data-mock-toggle
        onClick={() => setAfter((v) => !v)}
        className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] left-1/2 z-[1002] h-11 -translate-x-1/2 rounded-full bg-s-ink px-5 font-heading text-[15px] font-bold text-white shadow-elevation-3" /* selected-ok: the one control on the screen */
      >
        {after ? "New" : "Now"}
      </button>
    </div>
  );
}
