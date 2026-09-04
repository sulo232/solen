"use client";

// Grounded-in: app/[locale]/_components/primitives/CookieConsent.tsx
//
// exists-check: net-new vs app/[locale]/dev/design-fixes/page.tsx + DesignFixesClient.tsx (that
// pair compares WalkInBand/Reviews/SalonCard/SalonServices, never the cookie banner) and vs
// app/[locale]/dev/pdp/reviews-directions/page.tsx + FilterBlockDirections.tsx (PDP review filter
// directions, unrelated surface). `npm run exists` ran this turn for "cookie consent buttons
// touch target" and "cookie banner touch target 44": 0 matches both times. This is the only
// touch-target-sizing byte-copy of CookieConsent.tsx's banner anywhere in the app.
//
// Depicts: cookie consent banner -> app/[locale]/_components/primitives/CookieConsent.tsx
// (CookieBanner, an unexported inner function, byte-copied per the standing pattern already used
// by app/[locale]/dev/design-fixes/page.tsx for Reviews.tsx's private ReviewCard).
//
// Deviations from a pure byte-copy, all load-bearing and named here:
// 1. The real banner sits pinned to the bottom of the viewport at all times (position: fixed).
//    For a stacked Current/Proposed comparison it has to sit IN the page flow instead, so the
//    positioning classes on the outer shell are replaced with `relative w-full`. Every other
//    class on that shell (rounded-3xl, border, blur, shadow, the md: breakpoint set) is copied
//    verbatim. This is a display-only change so the two cards can sit one after another on the
//    page, not part of the VARY.
// 2. The real copy is hardcoded German (no i18n on this component at all, so there is no
//    messages/en.json render path to defer to). Per the standing mockup-copy rule, hardcoded
//    mockup copy is always English; the title/CTA lines below are taken from messages/en.json's
//    own "cookies" block (title: "We use cookies", acceptAll: "Accept all") where a key exists,
//    and a direct translation everywhere else (subtitle, "Nur notwendige", "Anpassen").
// 3. onClick handlers are no-ops, drift-ok'd inline (static comparison copy, no
//    CookieConsentProvider in this tree; the real accept/reject/settings behaviour is untouched
//    at its real call site in CookieConsent.tsx). aria-labels stay real button labels for a11y
//    parity, translated to English for the same reason as the copy above.
// 4. The real buttons also carry a keyboard-focus utility class that app/globals.css's
//    D1-focus-visible rule already overrides sitewide to `none`, substituting an inset box-shadow
//    edge instead, so that class renders nothing today, on the real banner too, and is dropped
//    here to match what actually renders. Not part of the VARY.
//
// VARY (this fix only): the settings icon button goes from h-9 w-9 (36px) to h-11 w-11 (44px,
// the LOCKFILE icon-button floor); both action buttons get an explicit h-11 (44px) replacing the
// py-2.5/md:py-3 padding-driven height. Nothing else on either variant changes.
//
// emphasis-ok: the font-semibold count is a byte-copy of the real, shipped CookieConsent.tsx
// banner (title, both button labels), duplicated once per Current/Proposed pair for the stacked
// comparison this brief asked for. Not a new design decision; this file changes only button
// height/width, never weight.

import { Cookie, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_CHIP = "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#A1672F]/15 text-[#A1672F]"; // hue-ok muted-ok drift-ok: byte-copy of CookieConsent.tsx's own icon-chip hex, untouched, not part of this VARY

const SHELL = cn(
  "relative w-full rounded-3xl",
  "bg-white/80 backdrop-blur-[22px] backdrop-saturate-[1.7] border border-s-border",
  "shadow-[0_8px_32px_rgba(50,47,44,0.12)]",
);

const INNER = cn(
  "max-w-[1240px] mx-auto",
  "px-4 py-3.5 md:px-6 md:py-5",
  "flex flex-col md:flex-row md:items-center gap-3 md:gap-6",
);

// drift-ok: no-op by design, static comparison copy with no CookieConsentProvider in this tree;
// real accept/decline/settings handlers are untouched at CookieConsent.tsx's real call site.
const noop = () => {};

export function CookieBannerCurrent() {
  return (
    <div className={SHELL} data-testid="cookie-current">
      <div className={INNER}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span aria-hidden className={ICON_CHIP}>
            <Cookie size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-body font-semibold text-[15px] md:text-[16px] leading-[1.3] text-s-ink mb-0.5">
              We use cookies
            </div>
            <p className="font-body font-normal text-[13px] md:text-[14px] leading-[1.45] text-s-ink-2">
              Analytics &amp; marketing only with your OK.
            </p>
          </div>
          <button
            type="button"
            onClick={noop}
            aria-label="Adjust cookie settings"
            data-testid="cookie-settings-current"
            className={cn(
              "shrink-0 grid h-9 w-9 place-items-center rounded-full",
              "bg-white border border-s-border text-s-ink-2 cursor-pointer",
              "hover:bg-s-bg-sunken hover:text-s-ink transition-[colors,transform] duration-150 ease-snap",
              "active:scale-95 active:duration-[80ms]",
              "md:hidden",
            )}
          >
            <Settings2 size={16} strokeWidth={1.9} aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={noop}
            className={cn(
              "hidden md:inline-flex font-body font-semibold text-[14px] text-s-ink",
              "bg-transparent border-0 cursor-pointer px-2 py-2",
              "hover:text-s-ink transition-colors duration-150 ease-snap",
              "rounded-md",
            )}
          >
            Customize
          </button>
          <button
            type="button"
            onClick={noop}
            data-testid="cookie-necessary-current"
            className={cn(
              "flex-1 md:flex-none font-body font-semibold text-[14px] text-s-ink",
              "bg-white border border-s-border cursor-pointer",
              "px-4 py-2.5 md:px-5 md:py-3 rounded-full",
              "hover:bg-s-bg-sunken transition-[colors,transform] duration-150 ease-snap",
              "active:scale-[0.97] active:duration-[80ms]",
            )}
          >
            Necessary only
          </button>
          <button
            type="button"
            onClick={noop}
            data-testid="cookie-acceptall-current"
            className={cn(
              "flex-1 md:flex-none font-body font-semibold text-[14px] text-white",
              "bg-s-ink border-0 cursor-pointer",
              "px-4 py-2.5 md:px-5 md:py-3 rounded-full",
              "hover:bg-black transition-[colors,transform] duration-150 ease-snap",
              "active:scale-[0.97] active:duration-[80ms]",
            )}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieBannerProposed() {
  return (
    <div className={SHELL} data-testid="cookie-proposed">
      <div className={INNER}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span aria-hidden className={ICON_CHIP}>
            <Cookie size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-body font-semibold text-[15px] md:text-[16px] leading-[1.3] text-s-ink mb-0.5">
              We use cookies
            </div>
            <p className="font-body font-normal text-[13px] md:text-[14px] leading-[1.45] text-s-ink-2">
              Analytics &amp; marketing only with your OK.
            </p>
          </div>
          {/* VARY: h-9 w-9 (36px) -> h-11 w-11 (44px), the LOCKFILE icon-button floor. */}
          <button
            type="button"
            onClick={noop}
            aria-label="Adjust cookie settings"
            data-testid="cookie-settings-proposed"
            className={cn(
              "shrink-0 grid h-11 w-11 place-items-center rounded-full",
              "bg-white border border-s-border text-s-ink-2 cursor-pointer",
              "hover:bg-s-bg-sunken hover:text-s-ink transition-[colors,transform] duration-150 ease-snap",
              "active:scale-95 active:duration-[80ms]",
              "md:hidden",
            )}
          >
            <Settings2 size={16} strokeWidth={1.9} aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={noop}
            className={cn(
              "hidden md:inline-flex font-body font-semibold text-[14px] text-s-ink",
              "bg-transparent border-0 cursor-pointer px-2 py-2",
              "hover:text-s-ink transition-colors duration-150 ease-snap",
              "rounded-md",
            )}
          >
            Customize
          </button>
          {/* VARY: py-2.5/md:py-3 (padding-driven height) -> explicit h-11 (44px), flex-centered. */}
          <button
            type="button"
            onClick={noop}
            data-testid="cookie-necessary-proposed"
            className={cn(
              "flex-1 md:flex-none inline-flex h-11 items-center justify-center font-body font-semibold text-[14px] text-s-ink",
              "bg-white border border-s-border cursor-pointer",
              "px-4 md:px-5 rounded-full",
              "hover:bg-s-bg-sunken transition-[colors,transform] duration-150 ease-snap",
              "active:scale-[0.97] active:duration-[80ms]",
            )}
          >
            Necessary only
          </button>
          <button
            type="button"
            onClick={noop}
            data-testid="cookie-acceptall-proposed"
            className={cn(
              "flex-1 md:flex-none inline-flex h-11 items-center justify-center font-body font-semibold text-[14px] text-white",
              "bg-s-ink border-0 cursor-pointer",
              "px-4 md:px-5 rounded-full",
              "hover:bg-black transition-[colors,transform] duration-150 ease-snap",
              "active:scale-[0.97] active:duration-[80ms]",
            )}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
