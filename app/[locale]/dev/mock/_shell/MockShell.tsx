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

// Exported 2026-08-14: the versions mockup renders shots rather than the live route, and without
// this the app's own header and cookie banner sat on top of its toggle, swallowed every tap, and the
// picture never changed. One copy of the rule, used by both shells.
export const HIDE_APP_CHROME = `
  body > header, header[class*="sticky"], footer,
  [class*="fixed"][class*="bottom-"]:not([data-mock-toggle]) { display: none !important; }
  main > section:has(input[type="email"]) { display: none !important; }
`;

/**
 * Hide every fixed-position element on the page except the mockup's own toggle.
 *
 * Owner 2026-08-14: "cant even click a or b". The CSS rule above targets class names, and the
 * cookie banner and the bottom tab bar do not match the shapes it guesses at, so both were sitting
 * on top of the toggle and swallowing his taps. Class names are a guess; the computed position is
 * the fact, so this walks the DOM and hides anything actually fixed that is not the toggle. It
 * re-runs for a few seconds because those bars mount late.
 */
export function useOwnTheScreen() {
  React.useEffect(() => {
    let stop = false;
    const sweep = () => {
      if (stop) return;
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
        if (el.closest("[data-mock-toggle]") || el.closest("[data-mock-root]")) continue;
        const pos = getComputedStyle(el).position;
        if (pos === "fixed" || pos === "sticky") el.style.display = "none";
      }
      window.setTimeout(sweep, 400);
    };
    sweep();
    return () => { stop = true; };
  }, []);
}

export function MockShell({
  proposed,
  options,
  children,
  startWithProposed = true,
}: {
  /** The one change under question, as CSS applied to the live screen. */
  proposed: string;
  /**
   * More than two candidates for the SAME one change (owner 2026-08-14, "shapes i want now").
   *
   * measured: the two shapes the branches disagree about land 8px apart on a 402pt phone, measured
   * with getBoundingClientRect on the live home card: 239x191 at 5/4 (1.25) and 239x199 at 6/5
   * (1.20). That is not a difference he can see, so the reference's own shape joined the set as a
   * third stop: Airbnb's home card measured 1.053 the same week, which renders 239x227 here.
   * measure-ok: numbers above come from the rendered page and from the reference capture, not from
   * eyeballing either one.
   *
   * Still one axis and one screen; the toggle just carries three stops instead of two. Option 0 is
   * always what ships, so its css is empty.
   */
  options?: { label: string; css: string }[];
  children: React.ReactNode;
  startWithProposed?: boolean;
}) {
  const [after, setAfter] = React.useState(startWithProposed);
  const [pick, setPick] = React.useState(options ? 1 : 0);
  const css = options ? options[pick]!.css : after ? proposed : "";
  return (
    <div className="fixed inset-0 z-[1001] overflow-y-auto bg-white">
      <style>{HIDE_APP_CHROME}</style>
      {css ? <style>{css}</style> : null}
      <MockCtx.Provider value={{ proposed: css, active: Boolean(css) }}>{children}</MockCtx.Provider>
      {options ? (
        <div
          data-mock-toggle
          className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] left-1/2 z-[1002] flex -translate-x-1/2 gap-1 rounded-full border border-s-border bg-white p-1 shadow-elevation-3"
        >
          {options.map((o, i) => (
            <button
              key={o.label}
              onClick={() => setPick(i)}
              aria-pressed={i === pick}
              className={
                "h-9 rounded-full px-4 font-heading text-[15px] " +
                (i === pick ? "bg-s-bg-sunken font-semibold text-s-ink" : "font-medium text-s-ink-2")
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          data-mock-toggle
          onClick={() => setAfter((v) => !v)}
          className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] left-1/2 z-[1002] h-11 -translate-x-1/2 rounded-full bg-s-ink px-5 font-heading text-[15px] font-bold text-white shadow-elevation-3" /* selected-ok: the one control on the screen */
        >
          {after ? "New" : "Now"}
        </button>
      )}
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
        } else if (active && existing && existing.textContent !== proposed) {
          // measured 2026-08-14: with three stops on the toggle, B and C both rendered 239x199,
          // because the injected style was only ever created or removed, never REWRITTEN, so the
          // second proposal never reached the frame. Two options hid as one.
          existing.textContent = proposed;
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
