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
  showOnLogin = false,
}: {
  children: ReactNode;
  showOnLogin?: boolean;
}) {
  const pathname = usePathname();
  if (!pathname) return <>{children}</>;

  // Booking flow, individual staff pages, and onboarding are self-contained —
  // always drop the marketing chrome.
  if (/\/(booking|staff\/[^/]+)\/?$/.test(pathname) || /\/onboarding(\/|$)/.test(pathname)) {
    return null;
  }

  // Auth pages are standalone (Uber pattern). EXCEPTION: the login page opts the
  // global Header back in via showOnLogin (Solen wordmark + hamburger) so it
  // carries the standard nav instead of a bespoke wordmark. Register/reset stay
  // standalone with their own lockups.
  if (/\/auth(\/|$)/.test(pathname)) {
    if (showOnLogin && /\/auth\/login(\/|$)/.test(pathname)) return <>{children}</>;
    return null;
  }

  return <>{children}</>;
}
