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

export default function PageTransition({ children, pathname: _pathname }: PageTransitionProps) {
  // V3-D75-pt-fix: AnimatePresence + mode="wait" was blocking child mount in
  // some Next.js App Router hydration paths — useEffects in nested client
  // components (Typewriter, SearchBar matchMedia, MorphingDialog mount) were
  // silently no-op'ing. Reverting to a plain pass-through; the 200ms page-fade
  // on route change is dropped in favor of children actually rendering.
  useSalonMorphName(); // S2: see the block above the hook
  return <>{children}</>;
}
