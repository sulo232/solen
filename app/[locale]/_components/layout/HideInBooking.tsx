"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * HideInBooking — drops site chrome inside focused, self-contained flows
 * (`/salon/[slug]/booking`, `/walk-in-pay`), mirroring how BottomTabBar bows out.
 *
 * These flows are self-contained (own back affordance + sticky action bar). The
 * global CityTopBar + Header + Breadcrumb + marketing Footer stacking on top is
 * off-pattern (Fresha booking has none of it) and used to crowd / cover the flow
 * — on /walk-in-pay the cookie banner + header literally covered the pay CTA.
 * Server-rendered children are passed through; this only gates visibility by route.
 */
export default function HideInBooking({
  children,
  showOnAuth = false,
  hideOnFeed = false,
  hideOnDashboard = false,
  hideOnAccount = false,
  coverSalonDetail = false,
}: {
  children: ReactNode;
  showOnAuth?: boolean;
  /** V3-D414: also drop on the discovery experience (an infinite Pinterest-style scroll has no "bottom" for a
      marketing footer, it just crowded the feed). Opt-in, so only the footer uses it, not the header. */
  hideOnFeed?: boolean;
  /** Also drop on the owner dashboard (/[locale]/dashboard...). The dashboard has its own
      chrome (DashboardLayout topbar + icon rail); the marketing Footer + cookie banner
      stacking in overlapped content + intercepted taps on mobile. Opt-in, footer only. */
  hideOnDashboard?: boolean;
  /** Also drop on the customer account section (/[locale]/profile + /account...).
      Modern account screens (Uber/Fresha) carry no marketing footer; opt-in, footer only. */
  hideOnAccount?: boolean;
  /** Also hide on the salon detail PDP (/[locale]/salon/[slug]). The PDP is a
   *  self-contained hero with its own back arrow (Fresha pattern); opt the
   *  global Header + Breadcrumb out so the page leads with the hero. */
  coverSalonDetail?: boolean;
}) {
  const pathname = usePathname() ?? "/";
  if (!pathname) return <>{children}</>;

  // PREVIEW ROUTES CARRY NO APP CHROME. Added 2026-08-16, owner: "cant press button on review
  // question". He tapped the options and nothing appeared to happen.
  //
  // MEASURED, on his own viewport (375x812, touch emulation, over the tunnel): the option buttons
  // end at y=376, and the first thing they change, the reviewer's photo disc, sits at y=647. The
  // cookie banner's top edge is at y=656. Nine pixels. On a real iPhone, where Safari's own toolbar
  // eats more height than the emulator does, that nine becomes negative and the ONLY visible
  // response to his tap is underneath the cookie bar. So the button worked every time and looked
  // completely dead, which is exactly what he reported.
  //
  // The header, the bottom nav and the consent bar all belong to the PRODUCT. A /dev preview page
  // is me showing him one section to decide on; none of that chrome is part of the decision, all of
  // it eats the screen he is deciding on, and the bottom two float over the thing being judged.
  // This is also the same class as the interaction-proof lesson from yesterday: the page was
  // verified by clicking it in a pane where nothing covered anything, and the failure lived
  // entirely in the part I was not looking at.
  if (/\/dev(\/|$)/.test(pathname)) return null;

  if (hideOnFeed && /\/inspo(\/|$)/.test(pathname)) return null;

  if (hideOnDashboard && /\/dashboard(\/|$)/.test(pathname)) return null;

  // Customer account section — no marketing footer below the account content.
  if (hideOnAccount && /\/(profile|account)(\/|$)/.test(pathname)) return null;

  // V3-D414: board detail + saved (/inspo/board/[id], /inspo/saved, /inspo/saved/[id]) are focused views
  // with their own back button. Drop the marketing chrome (city bar, header, breadcrumb, footer) so there aren't
  // doubled back/cancel controls stacked above them. The feed (/inspo) is unaffected and keeps its header.
  if (/\/inspo\/(board|saved)(\/|$)/.test(pathname)) return null;

  // The look-detail page (/inspo/<uuid>) is a focused PDP-style view: a full-bleed hero with its own frosted
  // back + heart over the photo. Drop the global chrome so the hero leads and the back isn't doubled. Matched by the
  // uuid shape so the feed (/inspo) and the board/saved subroutes above are untouched. (Discovery detail rebuild.)
  if (/\/inspo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/.test(pathname)) return null;

  // Booking flow, individual staff pages, onboarding, and the walk-in pay flow are
  // self-contained — always drop the marketing chrome. The guest self-service
  // recovery routes (/booking/lookup, /booking/resend-link) carry their own app bar
  // + back affordance, so they drop it too (else the global header doubles the back).
  if (
    /\/(booking|staff\/[^/]+|walk-in-pay)\/?$/.test(pathname) ||
    /\/booking\/(lookup|resend-link)\/?$/.test(pathname) ||
    // Walk-in live-queue tracker (/queue/[token]) is a self-contained focused screen —
    // own salon hero + back affordance + sticky action bar. Drop the marketing chrome
    // so the footer/newsletter/cookie banner don't stack onto the live status (same
    // rationale as /walk-in-pay). V3-D470c.
    /\/queue\/[^/]+\/?$/.test(pathname) ||
    // Refund/appeal flows (report-a-problem + case status/timeline + escalate) and the
    // salon-upcharge approve/decline screen are self-contained — own app bar + back
    // affordance + sticky CTA. Drop the marketing chrome (same rationale as
    // /booking/lookup) so it doesn't double the back or crowd the flow with the city
    // bar + footer.
    /\/bookings\/[^/]+\/(report|refund|upcharge)\/?$/.test(pathname) ||
    /\/onboarding(\/|$)/.test(pathname) ||
    // REVERTED 2026-08-09, same day, by the owner: "we should keep the back. how else are they
    // gonna go back?"
    //
    // Seven more routes were added here after capturing how Airbnb and Uber Eats strip the bar on
    // a task screen (_design-system/references/chrome-by-page-type.md). The capture was right and
    // the application was wrong, because I copied HALF the pattern. Both references remove the bar
    // AND leave one control: Uber Eats an X, Airbnb a floating back arrow. I removed the bar and
    // left nothing.
    //
    // Measured after he objected, on all seven: `walk-in-join`, `walk-in-tip`, `confirmation`,
    // `staff-invite`, `tip/[id]`, `vouchers/buy` and `gift-card` contain ZERO back, close, or
    // router.back controls between them. Stripping the header took away their only way out.
    //
    // The routes above keep their exemption because each one does carry its own back: the booking
    // wizard draws an arrow on every step (BookingWizard.tsx:186), and the rest were checked when
    // they were added. Any of these seven can rejoin that list the day it grows its own control,
    // not before.
    false
  ) {
    return null;
  }

  // Salon detail PDP — the MOBILE hero carries its own back/share/heart, so drop the global
  // chrome there (Fresha hero-first pattern). Desktop keeps it: the desktop hero is a gallery
  // with no back affordance + needs the nav. `contents` keeps the sticky header behaving as a
  // direct child on desktop; `max-md:hidden` removes it on mobile.
  if (coverSalonDetail && /\/salon\/[^/]+\/?$/.test(pathname)) {
    return <div className="contents max-md:hidden">{children}</div>;
  }

  // Auth pages are standalone (Uber pattern). EXCEPTION: login + register opt the
  // global Header back in via showOnAuth (Solen wordmark + hamburger) so they
  // carry the standard nav instead of a bespoke wordmark. Reset-password stays
  // standalone with its own lockup.
  if (/\/auth(\/|$)/.test(pathname)) {
    if (showOnAuth && /\/auth\/(login|register)(\/|$)/.test(pathname)) return <>{children}</>;
    return null;
  }

  return <>{children}</>;
}
