"use client";

// exists-check: `npm run exists "mock salon reviews"` = 0. The three /dev/airbnb-0N pages exist and
// are NOT this: they are comparison documents, which is exactly what he rejected on 2026-08-12
// ("that is not a fucking mock"). This is the screen itself.
//
// THE SHAPE, per the definition now written at the top of public/_mockups/_BASE.md: full-bleed at
// 402, one screen, silent, the real route, before and after as a TOGGLE and never two panes.
// Nothing on this page explains anything. The reasoning lives in the commit message and in
// _plans/AIRBNB_UI_LOOP_2026-08-12.md.
//
// lang-ok: this mockup FRAMES a real localised route rather than restating its copy. The only
// string this file owns is the toggle, which is English ("Now" / "New"); everything else on screen
// is the live German page rendered through i18n, which the English-mockup rule exempts by name. The
// route path itself carries a German anchor because that is the real page's own anchor id, not copy.
//
// measure-ok: the two values injected are the council's live measurement of Airbnb's own listing
// on 2026-08-12 (review body 14px in the page ink, reviewer name one step smaller at weight 500),
// against ours at SalonReviews.tsx:302 (15px, rgb(107,107,107)) and :279 (16px, weight 600).

import * as React from "react";

// Route history, so nobody repeats it: `#bewertungen` landed on the footer; the dedicated
// `/reviews` route renders its heading and then nothing, so it is not the screen either. The
// reviews live on the salon page itself, so this frames that and parks on them, and it dismisses
// the cookie banner inside the frame because otherwise the banner covers the bottom third of the
// screen he is being asked to look at.
const ROUTE = "/de/salon/cuts-and-culture";

const PROPOSED = `
  [class*="prose-measure"][class*="text-[15px]"] { font-size: 14px !important; color: rgb(10,10,10) !important; }
  [class*="text-[16px]"][class*="font-semibold"] { font-size: 14px !important; font-weight: 500 !important; }
`;

export default function Screen() {
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [after, setAfter] = React.useState(true);

  // WHY NOT A TALL FRAME, learned the hard way: making the iframe as tall as the document and
  // translating it looked deterministic and produced a completely different layout, because the
  // salon page has blocks sized against the viewport, so a 4000px-tall viewport rearranges the
  // page. The frame stays phone-height and its scroll is re-asserted instead.
  //
  // measured on the real page, which is what the number below is: the reviews section starts at
  // document y 1591 and is 858 tall, between Team (1305) and Portfolio (2554).
  React.useEffect(() => {
    let stop = false;
    const started = Date.now();
    const hold = () => {
      if (stop || Date.now() - started > 15000) return;
      const doc = ref.current?.contentDocument;
      const win = ref.current?.contentWindow;
      if (doc && win) {
        const consent = [...doc.querySelectorAll("button")].find((b) => /notwendige/i.test(b.textContent || ""));
        if (consent) (consent as HTMLButtonElement).click();
        const section = [...doc.querySelectorAll("section")].find((el) => /Bewertungen/.test(el.textContent || ""));
        if (section) {
          const top = section.getBoundingClientRect().top + win.scrollY;
          if (Math.abs(win.scrollY - top) > 2) win.scrollTo(0, top);
        }
      }
      window.setTimeout(hold, 350);
    };
    hold();
    return () => { stop = true; };
  }, []);

  React.useEffect(() => {
    let stop = false;
    const tick = () => {
      if (stop) return;
      const doc = ref.current?.contentDocument;
      if (doc?.head) {
        const existing = doc.querySelector("style[data-mock]");
        if (after && !existing) {
          const el = doc.createElement("style");
          el.setAttribute("data-mock", "1");
          el.textContent = PROPOSED;
          doc.head.appendChild(el);
        } else if (!after && existing) {
          existing.remove();
        }
      }
      window.setTimeout(tick, 300);
    };
    tick();
    return () => { stop = true; };
  }, [after]);

  return (
    <div className="fixed inset-0 z-[1001] bg-white">
      {/* The app's own cookie banner and chat bubble sit above everything on this route too, and a
          mockup is judged by looking at it, so anything that is not the screen is hidden here. */}
      <style>{`[class*="fixed"][class*="bottom-"]:not([data-mock-toggle]) { display: none !important; }`}</style>
      <iframe ref={ref} src={ROUTE} title="Salon reviews" className="h-full w-full border-0" />
      <button
        data-mock-toggle
        onClick={() => setAfter((v) => !v)}
        className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] left-1/2 z-[1000] h-11 -translate-x-1/2 rounded-full bg-s-ink px-5 font-heading text-[15px] font-bold text-white shadow-elevation-3" /* selected-ok: the one control on the screen */
      >
        {after ? "New" : "Now"}
      </button>
    </div>
  );
}
