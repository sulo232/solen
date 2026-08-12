"use client";

// exists-check: net-new as a comparison surface, but NOT net-new as an idea, and the difference is
// worth more than the file. `docs/superpowers/specs/2026-03-30-airbnb-image-aspect-ratio.md` was
// read before writing this and it already prescribes, for exactly this card on mobile,
// `aspect-[20/19]`. That is 1.0526. The ratio measured on Airbnb's live home today is 1.053. The
// same number, written down in March and never in the code: the card ships at `aspect-[5/4]`,
// which is 1.25. So this mockup is not proposing a discovery, it is showing an existing spec the
// product never followed. Also read: `_design-system/references/airbnb--home-search-chrome.md`
// (the search chrome, not the rail) and `_design-system/references/airbnb--home-mobile.md` (the
// measurements this uses).
//
// measure-ok: every number injected below was measured on the live DOM of both pages at 390x844px
// on 2026-08-12, and they are quoted in the page beside this. pixel-spec-auto was run on the
// reference still first and returned FAILURE on the borderless card, which is its documented
// fallback path.
//
// Two live iframes of the SAME real route, `/de`. The left is untouched. The right gets one
// stylesheet injected into its own document, changing exactly two things:
//   1. the rail item width, from `calc((100vw - 44px) / 1.5)` (231px on a 390px screen) to 165px,
//      the width Airbnb's card measures
//   2. the photo box ratio, from `aspect-[5/4]` (1.25) to 1.053, which is both what Airbnb
//      measures today and what our own March spec asked for
// Nothing else is overridden: same component, same data, same gutter, same radius, same type.

import * as React from "react";

const PHONE_W = 390;
const PHONE_H = 720;

const AIRBNB_GEOMETRY = `
  /* the rail item: their measured 165px instead of our computed 231px */
  [class*="snap-start"][class*="w-[calc((100vw"] { width: 165px !important; }
  /* the photo box: 1.053 instead of our 5/4, which is our own 20/19 spec restated */
  [class*="aspect-[5/4]"] { aspect-ratio: 1.053 !important; }
`;

function Phone({ label, note, inject }: { label: string; note: string; inject?: string }) {
  const ref = React.useRef<HTMLIFrameElement>(null);

  // The iframe's `load` event is unreliable here: it can fire before React attaches the handler,
  // and the inner app keeps replacing its own head as it hydrates, which drops an injected tag.
  // Measured on the first attempt: both panes came back `injected: false`. So poll instead, and
  // re-add the tag if the inner document ever loses it.
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
        <iframe
          ref={ref}
          src="/de"
          title={label}
          style={{ width: PHONE_W, height: PHONE_H, border: 0 }}
        />
      </div>
    </div>
  );
}

export default function HomeRail() {
  return (
    <div className="mt-8">
      <div className="flex gap-6 overflow-x-auto pb-4">
        <Phone
          label="Now"
          note="Our card is 231px wide with a 1.25 photo, so one and a half fit on the screen."
        />
        <Phone
          label="Airbnb's geometry"
          note="Their 165px width and 1.053 photo, on our page. Two and a bit fit, and the third is cropped on purpose."
          inject={AIRBNB_GEOMETRY}
        />
      </div>

      <div className="mt-6 max-w-[760px] space-y-3">
        <p className="text-[14px] leading-relaxed text-s-ink">
          Worth knowing before you judge it: this is not a new idea. A spec written in March, still
          in this repo, already says the mobile salon card should be 20/19, which is 1.0526. Airbnb
          measures 1.053 today. The card ships at 1.25. So the number was agreed once and the code
          never followed it.
        </p>
        <p className="text-[14px] leading-relaxed text-s-ink">
          What it buys: more stores on screen without scrolling, and a visible next card that says
          the rail continues. That is the whole reason their home reads as choice rather than as a
          brochure.
        </p>
        <p className="text-[14px] leading-relaxed text-s-ink-2">
          What it costs: the photo gets smaller, so a busy salon photo has less room to read, and
          the name and price underneath sit in a narrower column and will wrap sooner on long
          names. Their card is nearly square, which suits a room; a salon photo is usually wider
          than it is tall, so the crop takes more off the sides.
        </p>
        <p className="text-[14px] leading-relaxed text-s-ink-2">
          Not touched here on purpose: the corner radius (theirs 20, ours 22), the gutter (both
          12), the type, the colours, the order of the sections.
        </p>
      </div>
    </div>
  );
}
