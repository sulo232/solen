"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * FooterGate — hides the site marketing footer inside the focused booking flow
 * (`/salon/[slug]/booking`), mirroring how BottomTabBar drops out there.
 *
 * Fresha-style booking is a self-contained flow with a sticky action bar; a
 * marketing footer below it (a) is off-pattern and (b) used to scroll past /
 * cover the fixed action bar at the bottom. Server-rendered <Footer> is passed
 * as children so this only gates visibility, nothing else.
 */
export default function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (pathname && /\/booking\/?$/.test(pathname)) return null;
  return <>{children}</>;
}
