"use client";

// exists-check: net-new. Read first and not duplicated: `app/[locale]/dev/airbnb-01-home/` (home
// rail), `app/[locale]/dev/airbnb-02-search/` (search results), `app/[locale]/dev/airbnb-findings/`
// (the list of all 51), `app/[locale]/dev/pdp/` (an older PDP overhaul surface, a different
// question). None of them shows the reviews text ranking against Airbnb's.
//
// measure-ok: numbers come from the council's live measurements of both pages at 390x844px on
// 2026-08-12, quoted in the page beside this. The two class strings being overridden are
// `SalonReviews.tsx:279` (name, 16px semibold ink) and `SalonReviews.tsx:302` (body, 15px grey).
//
// Same format as screens 1 and 2: two live iframes of the SAME real route, one stylesheet injected
// into the right one, nothing else touched.

import * as React from "react";

const PHONE_W = 390;
const PHONE_H = 760;
const ROUTE = "/de/salon/cuts-and-culture#bewertungen";

// The proposal, and only it: the words become the ink and take the size step, the byline steps
// down to the same size at a lighter weight. Nothing else in the card moves.
const REVIEW_RANK = `
  /* the review body: out of the timestamp grey, into the page ink, one step down in size */
  [class*="prose-measure"][class*="text-[15px]"] { font-size: 14px !important; color: rgb(10,10,10) !important; }
  /* the reviewer name: same size as the body, one weight lighter */
  [class*="text-[16px]"][class*="font-semibold"] { font-size: 14px !important; font-weight: 500 !important; }
`;

function Phone({ label, note, inject }: { label: string; note: string; inject?: string }) {
  const ref = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (!inject) return;
    let stop = false;
    const tick = () => {
      if (stop) return;
      const doc = ref.current?.contentDocument;
      if (doc?.head && !doc.querySelector("style[data-airbnb-inject]")) {
        const el = doc.createElement("style");
        el.setAttribute("data-airbnb-inject", "1");
        el.textContent = inject;
        doc.head.appendChild(el);
      }
      window.setTimeout(tick, 400);
    };
    tick();
    return () => { stop = true; };
  }, [inject]);

  return (
    <div className="shrink-0">
      <p className="text-[15px] font-semibold text-s-ink">{label}</p>
      <p className="mb-2 max-w-[390px] text-[13px] leading-snug text-s-ink-2">{note}</p>
      <div className="overflow-hidden rounded-[22px] border border-s-border" style={{ width: PHONE_W, height: PHONE_H }}>
        <iframe ref={ref} src={ROUTE} title={label} style={{ width: PHONE_W, height: PHONE_H, border: 0 }} />
      </div>
    </div>
  );
}

export default function SalonCompare() {
  return (
    <div className="mt-8">
      <div className="flex gap-6 overflow-x-auto pb-4">
        <Phone
          label="Now"
          note="The name is the biggest, darkest thing in the card. What the customer wrote is grey."
        />
        <Phone
          label="Proposed"
          note="The words take the black and the size. The name steps down to the same size, lighter."
          inject={REVIEW_RANK}
        />
      </div>

      <div className="mt-6 max-w-[820px] space-y-3">
        <p className="text-[14px] leading-relaxed text-s-ink">
          Why this one is worth doing first out of the whole list: reviews are the reason a stranger
          books a salon they have never been to, and right now the sentence that does that work is
          painted in the colour this design system reserves for timestamps and hints. Our own rule
          says that grey is only for text that carries no weight. A review carries all of it.
        </p>
        <p className="text-[14px] leading-relaxed text-s-ink-2">
          What it costs: reviewer names get visually quieter, which is the trade. Also worth knowing,
          the date under the name is currently the same 14px, so once the body is 14px too, the date
          and the review are separated only by colour. If that reads muddy the date drops to 12px,
          which is the size this system already uses for that kind of line.
        </p>
        <p className="text-[14px] leading-relaxed text-s-ink-2">
          Not touched: the star row, the filter chips you approved in July, the salon reply block,
          the see-all control, and the order of anything on the page.
        </p>
      </div>
    </div>
  );
}
