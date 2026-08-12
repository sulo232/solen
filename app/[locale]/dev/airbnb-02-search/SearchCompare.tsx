"use client";

// exists-check: net-new. Read first: `_design-system/references/airbnb--home-mobile.md` (screen 1,
// the home rail, different surface), `_design-system/references/airbnb--home-search-chrome.md` (the
// search CHROME, which is the bar, not the results page), and `app/[locale]/dev/airbnb-01-home/`
// (screen 1's comparison, same format, different route). Nothing existing covers the search RESULTS
// page against Airbnb's.
//
// measure-ok: every number here was taken off the live DOM of both pages at 390x844px on
// 2026-08-12 with getBoundingClientRect. The Airbnb still lives at
// `public/_pixel-refs/airbnb/search-mobile/search-390.png`.
//
// psych-ok: the counts below are measurements of two rendered pages reported in a dev document,
// not a count rendered into product UI.
//
// THE HONEST LIMIT OF THIS PAGE, stated rather than hidden. Screen 1's difference was a treatment,
// so it could be injected into the real page and shown truthfully. This one is not: putting a map
// across the top two thirds of the search page is a change to what the page IS, and no stylesheet
// can fake it without lying about how it would behave. So the right pane shows the ONE part of
// their structure that IS a treatment, the results as a single full-width column instead of
// side-scrolling rows, and their own screen sits beside it as the record of the rest.

import * as React from "react";

const PHONE_W = 390;
const PHONE_H = 720;

// Their sheet lists results in one full-width column. Ours puts them in side-scrolling rows. That
// part is injectable: let the row wrap and give each card the full width.
const ONE_COLUMN = `
  [class*="overflow-x-auto"][class*="salon-card"] { display: block !important; overflow-x: visible !important; }
  [class*="snap-start"][class*="w-[calc((100vw"] { width: 100% !important; margin-bottom: 16px !important; }
  [class*="aspect-[5/4]"] { aspect-ratio: 1 !important; }
`;

function Phone({ label, note, src, inject }: { label: string; note: string; src: string; inject?: string }) {
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
        <iframe ref={ref} src={src} title={label} style={{ width: PHONE_W, height: PHONE_H, border: 0 }} />
      </div>
    </div>
  );
}

export default function SearchCompare() {
  return (
    <div className="mt-8">
      <div className="flex gap-6 overflow-x-auto pb-4">
        <Phone
          label="Ours now"
          note="Side-scrolling rows of the same card the home page uses. No map on this screen."
          src="/de/basel/coiffeur"
        />
        <Phone
          label="Ours as one column"
          note="The part of their structure that is a treatment: one full-width result per row, square photo. The map is not here, see the note below."
          src="/de/basel/coiffeur"
          inject={ONE_COLUMN}
        />
        <div className="shrink-0">
          <p className="text-[15px] font-semibold text-s-ink">Theirs, as captured</p>
          <p className="mb-2 max-w-[390px] text-[13px] leading-snug text-s-ink-2">
            Live on 2026-08-12. Map across the top two thirds with prices on it, results in a sheet
            underneath.
          </p>
          <div className="overflow-hidden rounded-[22px] border border-s-border" style={{ width: PHONE_W, height: PHONE_H }}>
            <img
              src="/_pixel-refs/airbnb/search-mobile/search-390.png"
              alt="Airbnb search results on a phone"
              style={{ width: PHONE_W, display: "block" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-[820px] space-y-3">
        <p className="text-[14px] leading-relaxed text-s-ink">
          The real difference is not the card, it is the question the page answers first. Theirs
          opens with where the places are and how much they cost, right on the map, and you pull the
          list up when you want detail. Ours opens with a list and keeps the map behind a separate
          view.
        </p>
        <p className="text-[14px] leading-relaxed text-s-ink">
          Why that matters more for us than for them: a stay is chosen mostly on price and photos,
          but a salon is chosen on whether you can get there. Distance is the strongest filter a
          person applies, and today it is the one thing our search screen does not show.
        </p>
        <p className="text-[14px] leading-relaxed text-s-ink-2">
          What it costs: a map across the top pushes the first salon below the fold, so someone who
          just wants a list has to scroll or switch. It also needs a real map on every search, which
          is a paid call per view. And it collides with nothing in writing, but it does change a
          page you have not asked me to change, which is why it is a note here rather than a build.
        </p>
        <p className="text-[14px] leading-relaxed text-s-ink-2">
          Honest limit: the middle phone is real, the right one is a photograph of their page. A
          stylesheet cannot fake a map, so I did not pretend to.
        </p>
      </div>
    </div>
  );
}
