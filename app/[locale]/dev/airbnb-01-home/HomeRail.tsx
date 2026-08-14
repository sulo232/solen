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

// The council's third surviving finding, measured on both pages the same minute: their rail
// scroller is full bleed, clientWidth 390 at left 0, so the cropped next card runs off the glass.
// Ours sits at left 4 with width 382 and a parent that clips at x=386, leaving a 4px white strip
// before the edge. The half-visible card stops short of the screen, which quietly cancels the
// "there is more to the right" promise the crop exists to make.
// The exact chain, measured on the live page rather than guessed at (a first attempt targeted the
// wrong two elements and moved nothing, which the rendered numbers caught):
//   img  ->  photo box  ->  a.snap-start  ->  div.overflow-x-auto (left 4, right 386, pad 12,
//   margin -12)  ->  div.px-3.overflow-hidden (left 4, right 386, pad 12)  ->  div.px-1 (left 0,
//   right 390, pad 4)  ->  section
// So the 4px strip is the `px-1` wrapper's own padding, and the clipping happens one level below
// it. Zero that padding and drop the clip, and the row reaches the glass while the card keeps its
// 16px inset. The scroller's padding is 20 rather than 16 because the first attempt measured the
// card at 12: the wrapper's own padding stays at 12, so the 4 that the zeroed px-1 used to supply
// has to come from here instead.
const AIRBNB_GEOMETRY_PLUS_BLEED = `${AIRBNB_GEOMETRY}
  [class*="px-1"][class*="max-w-[1280px]"] { padding-left: 0 !important; padding-right: 0 !important; }
  [class*="px-3"][class*="overflow-hidden"] { overflow: visible !important; padding-left: 16px !important; padding-right: 16px !important; }
  [class*="overflow-x-auto"][class*="salon-card"] { margin-left: -16px !important; margin-right: -16px !important; padding-left: 20px !important; padding-right: 20px !important; }
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
        <Phone
          label="Plus the rail reaching the edge"
          note="The same, and the row now runs off the right side of the screen instead of stopping 4px short of it. One honest flaw in this pane: the first card sits 12px from the left instead of 16, because the injected padding fights the real one. In code that is exact, not approximate."
          inject={AIRBNB_GEOMETRY_PLUS_BLEED}
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

      <div className="mt-10 max-w-[860px]">
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
          What the whole comparison found, and what it threw out
        </h2>
        <p className="mt-1 text-[14px] leading-relaxed text-s-ink-2">
          Five readers took one angle each over the same two screens, and a sixth tried to kill
          everything they found. Sixty-six findings went in, eleven came out. A finding died if it
          had a number for only one side, if the number could have come from memory, if the two
          sides were measured at different widths, or if it re-opened something you already
          decided.
        </p>

        <ol className="mt-5 space-y-4">
          {[
            { t: "Your first screen shows two stores. Theirs shows four.", b: "That is the density difference in one number, and it is our own rule we are failing, not theirs: we ask for at least four things on a phone's first screen. Airbnb passes our floor. We do not. This is what the two phones above are about." },
            { t: "A third of their opening screen is photographs of real places. A fifth of ours is.", b: "Ours reaches 37% only if you count the map tile, and a map is not a store. Salon photography alone is 20.1% against their 32.6%." },
            { t: "Their first screen carries nearly three times more readable text than ours.", b: "66,673 against 24,022 square pixels of actual painted letters. Ours reads calm partly because there is very little on it to read." },
            { t: "Our card row stops 4px short of the right edge.", b: "Theirs runs off the glass. The cropped next card is the promise that the row continues, and a white strip before the edge quietly cancels it. That is the third phone above. It costs two changes in shared parts, so every row on the home page and the search page moves together." },
            { t: "Do NOT shrink our card's text to give the photo more room.", b: "Per card we already give the photo more of the card than they do, 74% against 67%. Their card gives its text more room, not less. This finding exists to stop a wrong fix." },
            { t: "Their page sits 24px off the edge, ours 16px.", b: "That is why theirs reads calmer while holding more. It is also a frozen value that touches every page in the product, so it is yours to reopen or leave." },
            { t: "Their black is softer than ours.", b: "Both are far above any readability requirement, so this is tone, not legibility. Changing ours moves every surface at once, so it stays until you say otherwise." },
            { t: "The 188px between the first and second row on our home carries no store photo at all.", b: "It is the map. Not proposed for change: you asked for exactly that on 5 August, and the row of nearby stores that used to be there was removed on your word." },
            { t: "Their bottom bar seals the screen edge, ours floats above it.", b: "Recorded, not proposed. You picked the floating one on 10 August." },
          ].map((f, i) => (
            <li key={i} className="rounded-[16px] bg-s-bg-sunken p-4">
              <p className="text-[14px] font-semibold leading-snug text-s-ink">{i + 1}. {f.t}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-s-ink-2">{f.b}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
          Two of our own rules turned out to be wrong, and that is the other half of this
        </h2>
        <p className="mt-1 text-[14px] leading-relaxed text-s-ink-2">
          You asked for the taste and the principles to improve, not only the screens. Both of
          these came out of measuring Airbnb rather than out of an opinion.
        </p>
        <div className="mt-4 space-y-4">
          <div className="rounded-[16px] border border-s-border p-4">
            <p className="text-[14px] font-semibold text-s-ink">
              Our rule allows two text weights on a screen. Nobody obeys it, including us.
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-s-ink-2">
              Airbnb&apos;s home uses three: normal, medium, semibold. Ours uses exactly the same
              three. Our own weight list defines three roles. So the cap of two has been broken by
              our own shipped screens since it was written, and the check that enforces it has been
              wrong rather than the screens. The cost of raising it to three: a looser cap catches
              less, so a screen could drift to three weights where two would have been better.
            </p>
          </div>
          <div className="rounded-[16px] border border-s-border p-4">
            <p className="text-[14px] font-semibold text-s-ink">
              Our rule wants the biggest text on a screen to be 1.8 times the body. Airbnb&apos;s
              home is 1.5, and ours is 1.29.
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-s-ink-2">
              Now that Airbnb is the source of truth, that rule is unreachable while we copy them:
              a photo-led browse screen does not carry a big headline in either product. The rule
              next to it already has a photograph exemption. Giving this one the same exemption
              makes it consistent. The cost: a screen with no photographs could hide behind the
              exemption and end up with no clear anchor at all, so the exemption has to name the
              photograph condition rather than being general.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
