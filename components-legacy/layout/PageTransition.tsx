"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_SOLEN } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
  pathname: string;
}

/** S2 (2026-08-03): the ONE element allowed to carry `vt-salon-<slug>` on the outgoing page.
 *
 *  A `view-transition-name` has to be unique per document. SalonCard.tsx used to stamp
 *  `vt-salon-${slug}` inline on every card it rendered, and /de renders the same salon in more
 *  than one rail: measured 20 duplicated slugs on the home page (atelier-haarwerk 4x,
 *  glow-lab-basel 3x, pink-petal-nails 3x, blade-and-stone 3x). Chrome does not quietly fall back
 *  for a duplicate, it logs "Unexpected duplicate view-transition-name: vt-salon-..." and kills
 *  the transition with "InvalidStateError: Transition was aborted", reproduced 2/2 on /de: open
 *  the search overlay, type "cut", tap a salon card, then history.back().
 *
 *  So the name is not applied at rest by anyone. Cards only CARRY it, in `data-vt-salon`. This
 *  listener applies it to the single card being activated and strips it from every other card,
 *  which makes uniqueness true by construction rather than by hoping no rail repeats a salon.
 *
 *  Why the capture phase of `click`, specifically:
 *   - `next-view-transitions`' Link calls `document.startViewTransition` from its own React
 *     onClick, which React dispatches from the root container. A listener on `document` in the
 *     capture phase therefore runs strictly before it, so the name is in place before the
 *     browser takes the outgoing snapshot. (SearchOverlay's own `onClickCapture` on the result
 *     row is also a React handler, so it is likewise later than this one.)
 *   - `click`, not `pointerdown`: a pointerdown that turns into a scroll would leave a card
 *     armed with nobody navigating. `click` fires only on a real activation, and it also covers
 *     keyboard activation (Enter on a focused card), which pointerdown does not.
 *
 *  Back-navigation: the outgoing PDP carries one name (SalonHero.tsx), the incoming home page
 *  carries none, so there is nothing to collide and nothing to abort, the pair cross-fades. That
 *  is strictly better than today, where the same navigation throws and no transition runs at all.
 *  Making the BACK direction morph too would need the incoming card to be named during the
 *  transition's own DOM update, which server-rendered cards cannot do; it is not in scope here
 *  and it is not what breaks.
 *
 *  This lives here because PageTransition is the one client node already mounted around every
 *  [locale] route and already named for cross-page transitions, so a second global component
 *  doing the same job would be a duplicate (exists-check run first: `npm run exists
 *  "view transition"` / `"viewtransition"` / `"shared element"`, no existing owner for this).
 */
function useSalonMorphName() {
  useEffect(() => {
    const clear = () => {
      document.querySelectorAll<HTMLElement>("[data-vt-salon]").forEach((el) => {
        el.style.removeProperty("view-transition-name");
      });
    };
    const arm = (event: Event) => {
      const from = event.target instanceof Element ? event.target : null;
      const link = from?.closest("a");
      // Runs on every click, so the previous arm is always undone first: at no instant can two
      // elements hold the same name.
      clear();
      if (!link) return;
      const box = link.querySelector<HTMLElement>("[data-vt-salon]");
      const name = box?.dataset.vtSalon;
      if (!box || !name) return;
      box.style.setProperty("view-transition-name", name);
    };
    document.addEventListener("click", arm, true);
    window.addEventListener("popstate", clear);
    return () => {
      document.removeEventListener("click", arm, true);
      window.removeEventListener("popstate", clear);
    };
  }, []);
}

/** Quiets `next-view-transitions`' unhandled promise rejections (S3, 2026-09-04).
 *
 *  `next-view-transitions` (0.3.5, the latest release, checked today) drives every route change
 *  through `document.startViewTransition(() => new Promise(...))`
 *  (node_modules/next-view-transitions/dist/index.js lines 137-147) and never attaches a rejection
 *  handler to the transition's own `finished` / `updateCallbackDone` / `ready` promises. Chrome caps
 *  a view transition's DOM-update phase at 4s: when a route swap runs long (a dev compile, a cold
 *  serverless page in prod), the browser aborts the transition and those promises reject with a
 *  `DOMException` (`name: "TimeoutError"`, `message: "Transition was aborted because of timeout in
 *  DOM update"`). Reproduced live on localhost:3461 today: four
 *  `Uncaught (in promise) TimeoutError` after a few card taps.
 *
 *  Nothing in the library catches that rejection, so it surfaces as `window`'s `unhandledrejection`.
 *  In development that pops the Next.js error overlay over the page even though the navigation
 *  itself completed fine (which is why the owner's test links looked broken), in production it is
 *  console noise for the same non-failure. This is the one client node already mounted around every
 *  [locale] route and already owns view-transition behaviour (see `useSalonMorphName` above), so a
 *  second global listener elsewhere would duplicate this one, not replace it.
 *
 *  The match is on the message prefix, not on `name === "TimeoutError"`: other web APIs (fetch,
 *  AbortController) raise a `TimeoutError` DOMException too, and swallowing those would hide a real
 *  bug. Chrome's View Transition API messages all start with "Transition was " (the timeout case
 *  above, "Transition was skipped because ...", "Transition was aborted" on a duplicate
 *  `view-transition-name`), so that prefix is the narrow, reliable signature.
 */
function useQuietMorphAborts() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason instanceof DOMException && reason.message.startsWith("Transition was ")) {
        event.preventDefault();
        console.warn("[PageTransition] page morph aborted, navigation continued:", reason.message);
      }
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
}

export default function PageTransition({ children, pathname: _pathname }: PageTransitionProps) {
  // V3-D75-pt-fix: AnimatePresence + mode="wait" was blocking child mount in
  // some Next.js App Router hydration paths — useEffects in nested client
  // components (Typewriter, SearchBar matchMedia, MorphingDialog mount) were
  // silently no-op'ing. Reverting to a plain pass-through; the 200ms page-fade
  // on route change is dropped in favor of children actually rendering.
  useSalonMorphName(); // S2: see the block above the hook
  useQuietMorphAborts(); // S3: see the block above the hook
  return <>{children}</>;
}
