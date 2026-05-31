"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * HideInBooking — drops site chrome inside the focused booking flow
 * (`/salon/[slug]/booking`), mirroring how BottomTabBar bows out there.
 *
 * The booking flow is self-contained (its own header with an exit X + a sticky
 * action bar). The global CityTopBar + Header + Breadcrumb + marketing Footer
 * stacking on top is off-pattern (Fresha booking has none of it) and used to
 * crowd / cover the flow. Server-rendered children are passed through; this
 * only gates visibility by route.
 */
export default function HideInBooking({
  children,
  showOnAuth = false,
}: {
  children: ReactNode;
  showOnAuth?: boolean;
}) {
  const pathname = usePathname();
  if (!pathname) return <>{children}</>;

  // Booking flow, individual staff pages, and onboarding are self-contained —
  // always drop the marketing chrome.
  if (/\/(booking|staff\/[^/]+)\/?$/.test(pathname) || /\/onboarding(\/|$)/.test(pathname)) {
    return null;
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
