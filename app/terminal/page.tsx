/**
 * Mockup-scope: whole-page
 *
 * Exists-check: `npm run exists terminal` returns the /[locale]/dev/terminal family only. This route
 * EXTENDS it rather than duplicating it: it renders the SAME `Screen` component and the SAME
 * `loadTerminalData` loader, and exists purely to sit OUTSIDE the `[locale]` segment.
 *
 * WHY IT EXISTS (owner 2026-08-17: "safari dead"). The /[locale]/dev/terminal route renders inside
 * the locale layout, so opening it loads the ENTIRE Solen site underneath the overlay: the global
 * header, the breadcrumb, the footer, the fixed bottom nav, the cookie consent provider, PostHog,
 * and the page-transition wrapper. On a phone in dev mode, unminified and with hot-reload attached,
 * that is a lot of work for a screen none of it is visible on. This route inherits only the root
 * layout (fonts plus globals.css), so the phone loads the screen and nothing else.
 *
 * A production build cannot serve either route anyway, since both call notFound() outside dev, so
 * "just build it" is not the fix here. Reachable at /terminal, no locale prefix.
 *
 * Dev-only. Blocked in production below.
 */
import { notFound } from "next/navigation";
import { loadTerminalData } from "../[locale]/dev/terminal/loadTerminalData";
import Screen from "../[locale]/dev/terminal/Screen";

export default async function BareTerminalPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { salonName, bookings, queue, staff, services } = await loadTerminalData();

  return (
    <Screen
      salonName={salonName}
      bookings={bookings}
      queue={queue}
      staff={staff}
      services={services}
    />
  );
}
