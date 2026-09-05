import { notFound } from "next/navigation";

/**
 * Grounded-in: app/[locale]/dev/round5/page.tsx (gate pattern, copied exactly per the
 * coordinator's correction to this brief).
 *
 * /dev/directions-0905 layout: the shared scaffold for the 2026-09-05 directions loop
 * (_plans/DIRECTIONS_0905.md), dev-only side-by-side comparison mockups (booking
 * confirmation, booking-flow motion, salon page, search results, home, a click/press
 * motion kit), each with at least three genuinely different directions behind `?v=a|b|c`.
 *
 * Exists-check: `npm run exists directions-0905` -> 1 REMOVED.md hit, an earlier
 * comparison batch under a different route name, rejected by the owner as a FORMAT (one
 * treatment tweak at a time). That is not this: this scaffold is for the newly-requested
 * format, three structurally different directions per screen, stacked for comparison.
 * `npm run exists seedBooking` -> 0, net-new loader.
 *
 * Depicts: this layout's own UI -> NET-NEW: it renders no visible UI at all, it only
 * gates the route. The comparison chrome lives in DirectionFrame.tsx; the surfaces
 * themselves are each builder's own `<surface>/page.tsx` (out of scope here).
 *
 * No extra chrome of its own: the real site header/footer come from the locale layout
 * above this route tree (app/[locale]/layout.tsx); this file only gates the route.
 *
 * Gate pattern: SAME as the current /dev/round5, /dev/unify, /dev/calm, /dev/design-fixes
 * etc. (NOT the older /dev/flows NODE_ENV-only gate, which 404s the owner's own phone
 * preview). The phone preview is served off a PRODUCTION build (`next build` + `next
 * start`, see round5/page.tsx's header comment: `next dev` does not reliably hydrate this
 * app), so a bare `NODE_ENV === "production"` check would 404 for him too. SOLEN_DEV_PAGES
 * is exported by hand only on the local test server that serves his preview; Netlify's
 * real production environment never defines it, so a real deploy stays gated.
 */
interface DirectionsLayoutProps {
  children: React.ReactNode;
}

export default function DirectionsLayout({ children }: DirectionsLayoutProps) {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") {
    notFound();
  }

  return <>{children}</>;
}
