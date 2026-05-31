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
  coverSalonDetail = false,
}: {
  children: ReactNode;
  showOnAuth?: boolean;
  /** V3-D414: also drop on the discovery experience (an infinite Pinterest-style scroll has no "bottom" for a
      marketing footer, it just crowded the feed). Opt-in, so only the footer uses it, not the header. */
  hideOnFeed?: boolean;
  /** Also hide on the salon detail PDP (/[locale]/salon/[slug]). The PDP is a
   *  self-contained hero with its own back arrow (Fresha pattern); opt the
   *  global Header + Breadcrumb out so the page leads with the hero. */
  coverSalonDetail?: boolean;
}) {
  const pathname = usePathname();
  if (!pathname) return <>{children}</>;

  if (hideOnFeed && /\/discover(\/|$)/.test(pathname)) return null;

  // V3-D414: board detail + saved (/discover/board/[id], /discover/saved, /discover/saved/[id]) are focused views
  // with their own back button. Drop the marketing chrome (city bar, header, breadcrumb, footer) so there aren't
  // doubled back/cancel controls stacked above them. The feed (/discover) is unaffected and keeps its header.
  if (/\/discover\/(board|saved)(\/|$)/.test(pathname)) return null;

  // Booking flow, individual staff pages, onboarding, and the walk-in pay flow are
  // self-contained — always drop the marketing chrome.
  if (/\/(booking|staff\/[^/]+|walk-in-pay)\/?$/.test(pathname) || /\/onboarding(\/|$)/.test(pathname)) {
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
