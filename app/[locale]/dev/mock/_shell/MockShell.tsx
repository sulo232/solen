"use client";

// exists-check: `npm run exists "mock shell"` = 0. This is the shared frame every mockup from here
// on uses, so the four failed attempts behind `mock/salon-reviews` are paid for once instead of
// repeated per screen.
//
// WHAT A MOCKUP IS, and this enforces it in code rather than in a comment (definition at the top of
// public/_mockups/_BASE.md, owner 2026-08-12 "refine the definition of a mock up"):
//   full-bleed, one screen, silent, the real route, before and after on a TOGGLE.
//
// THE TWO THINGS THAT COST FOUR ATTEMPTS, solved here once:
//   1. The app's header, newsletter and footer are painted OVER a full-screen panel, not under it,
//      because a transformed ancestor traps the stacking context, so no z-index wins. They are
//      hidden outright instead.
//   2. Framing a real page in an iframe and scrolling it does not mount lazily-revealed sections,
//      so a framed page shows its heading and nothing else. Anything that needs a section deep in a
//      page composes the component directly instead of framing the page.
//
// lang-ok: the screens render German through i18n; the only strings this file owns are the two
// toggle labels, in English.

import * as React from "react";

// A parent <style> cannot reach inside an iframe: measured on the first run of the batch, the home
// card stayed 239px wide with the proposal supposedly applied. So the framed variant injects into
// the frame's own document, and the shell hands it the CSS and the on/off state through context.
const MockCtx = React.createContext<{ proposed: string; active: boolean }>({ proposed: "", active: false });

const HIDE_APP_CHROME = `
  body > header, header[class*="sticky"], footer,
  [class*="fixed"][class*="bottom-"]:not([data-mock-toggle]) { display: none !important; }
  main > section:has(input[type="email"]) { display: none !important; }
`;

export function MockShell({
  proposed,
  children,
  startWithProposed = true,
}: {
  /** The one change under question, as CSS applied to the live screen. */
  proposed: string;
  children: React.ReactNode;
  startWithProposed?: boolean;
}) {
  const [after, setAfter] = React.useState(startWithProposed);
  return (
    <div className="fixed inset-0 z-[1001] overflow-y-auto bg-white">
      <style>{HIDE_APP_CHROME}</style>
      {after ? <style>{proposed}</style> : null}
      <MockCtx.Provider value={{ proposed, active: after }}>{children}</MockCtx.Provider>
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

/** For screens that render standalone, framing the real route is honest and cheapest. */
export function MockRoute({ src }: { src: string }) {
  const ref = React.useRef<HTMLIFrameElement>(null);
  const { proposed, active } = React.useContext(MockCtx);

  React.useEffect(() => {
    let stop = false;
    const tick = () => {
      if (stop) return;
      const doc = ref.current?.contentDocument;
      if (doc?.head) {
        // the app's own chrome, inside the frame this time
        if (!doc.querySelector("style[data-mock-chrome]")) {
          const c = doc.createElement("style");
          c.setAttribute("data-mock-chrome", "1");
          c.textContent = HIDE_APP_CHROME;
          doc.head.appendChild(c);
        }
        const consent = [...doc.querySelectorAll("button")].find((b) => /notwendige/i.test(b.textContent || ""));
        if (consent) (consent as HTMLButtonElement).click();
        const existing = doc.querySelector("style[data-mock-proposed]");
        if (active && !existing) {
          const el = doc.createElement("style");
          el.setAttribute("data-mock-proposed", "1");
          el.textContent = proposed;
          doc.head.appendChild(el);
        } else if (!active && existing) {
          existing.remove();
        }
      }
      window.setTimeout(tick, 350);
    };
    tick();
    return () => { stop = true; };
  }, [proposed, active]);

  return <iframe ref={ref} src={src} title="screen" className="h-full min-h-screen w-full border-0" />;
}
