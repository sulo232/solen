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
export default function HideInBooking({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname && /\/(booking|staff\/[^/]+)\/?$/.test(pathname)) return null;
  return <>{children}</>;
}
