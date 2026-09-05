"use client";

import * as React from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { withDateParam } from "./_shared";
import { useCookieConsent } from "../primitives/CookieConsent";

/**
 * mockup-ok: SalonMobileBookBar, 2026-07-24 PORT (ref
 * _overhaul/SalonMobileBookBarOverhaul.tsx). Sticky bottom mobile CTA, per Fresha
 * pattern, a prominent full-width button anchored to the bottom of the viewport,
 * always visible while scrolling, never parking/snapping (owner: "it doesn't move
 * from there").
 *
 * Portaled straight to document.body (SSR-guarded via a mounted flag): the root
 * layout's `<main id="main-content" isolate>` traps a plain fixed child inside its
 * own stacking context, so the page's later `<footer>` sibling was painting over this
 * bar regardless of z-index. Portaling escapes that trap. z-[800] is ABOVE the cookie
 * consent banner (`z-tooltip` = 700 in tailwind.config.js), which otherwise painted
 * over the bar at page bottom.
 *
 * REGRESSION FIX (2026-07-24, same-day follow-up): z-[800] also beats the full-screen
 * gallery (`SalonImageGallery`, z-[70]) and lightbox (`SalonLightbox`, z-[80]) overlays,
 * both ALSO portaled to document.body, so the bar started floating on top of them. Those
 * two booleans already live in `SalonDetailV3` (the only real caller); rather than
 * re-derive "an overlay is open" from a DOM signal (both overlays toggle
 * `document.body.style.overflow`, which is an inline style, not something React can read
 * declaratively without a MutationObserver), the parent passes it down explicitly via
 * `suppressed`. Honest > clever.
 *
 * CONSENT-FLOW FIX (2026-07-25): that same z-[800] also beat the cookie consent banner
 * (`z-tooltip` = 700), which sits in the same bottom strip on mobile, so the bar physically
 * covered the banner's "Alle akzeptieren" / "Nur notwendige" buttons and ate the taps meant
 * for them: taps never reached the banner, so a first-time visitor could not dismiss it from
 * a salon page. Fix: this bar now also yields while consent is unanswered, reusing the SAME
 * `suppressed` gate rather than a second mechanism, driven by `useCookieConsent()`'s own
 * `hasConsented` (no bespoke localStorage read). Once the visitor answers either button,
 * `hasConsented` flips true and the bar returns to z-[800] as before.
 *
 * Hidden on desktop (`lg:hidden`), desktop uses SalonSidebar instead.
 */
export function SalonMobileBookBar({
  locale,
  slug,
  suppressed = false,
}: {
  locale: string;
  slug: string;
  /** True while a full-screen overlay (gallery/lightbox) is open, so this z-[800] bar
   * doesn't paint over it. Defaults to false so every other/future caller is unaffected. */
  suppressed?: boolean;
}) {
  const t = useTranslations("salonDetail");
  // GAP #5: a searched date (?date=YYYY-MM-DD, forwarded from the search result the
  // user tapped) rides through to the booking picker instead of getting dropped.
  const searchParams = useSearchParams();
  const bookingHref = withDateParam(`/${locale}/salon/${slug}/booking`, searchParams?.get("date"));

  // CONSENT-FLOW FIX (2026-07-25): fold "consent not answered yet" into the same
  // suppressed gate below, so this z-[800] bar never covers the cookie banner's buttons.
  const { hasConsented } = useCookieConsent();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || suppressed || !hasConsented) return null;

  // V3-D202 (A20): drop bg-white/95 backdrop-blur-md → bg-white per drift-detox.
  // V3-D442 (round 2): gradient content-fade above the bar instead of a hard
  // top border (CONTROL_ELEVATION: sticky bar on white = flat, no border/shadow).
  return ReactDOM.createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[800] bg-white px-4 py-3 lg:hidden before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:from-white before:to-transparent before:content-['']">
      <Link
        href={bookingHref}
        className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-[colors,transform] hover:bg-black active:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
      >
        {t("bookNow")}
        <ChevronRight size={16} strokeWidth={1.9} />
      </Link>
    </div>,
    document.body,
  );
}
