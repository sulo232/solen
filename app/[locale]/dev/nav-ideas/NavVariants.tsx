"use client";

// exists-check: `npm run exists "bottom nav mockup"` and `npm run exists nav-ideas` both return 0.
// Extends the live `app/[locale]/_components/layout/BottomNav.tsx` shipped earlier today rather
// than inventing a parallel one: variant A below is that component's exact current geometry, so
// the comparison is against the real thing and not a redrawing of it.

import * as React from "react";
import { Compass, Heart, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * His two corrections to the items, applied to every variant so only the SHELL differs:
 *   - no hamburger. A profile item instead.
 *   - saved gets a heart, not a bookmark.
 *   - the first item is not "Home". His word after that is unclear on the recording, so both
 *     readings are shown: "Explore" (Airbnb's own word for this slot, measured as "Erkunden")
 *     and "Search", which is what ships today. Pick one and it is a one-line change.
 *   - logged out, the profile item reads as sign-in.
 */
const ITEMS = [
  { key: "explore", label: "Explore", alt: "Search", Icon: Compass },
  { key: "saved", label: "Saved", alt: "Saved", Icon: Heart },
  { key: "profile", label: "Profile", alt: "Log in", Icon: User },
] as const;

function Item({
  Icon,
  label,
  on,
  compact = false,
  iconOnly = false,
}: {
  Icon: typeof Compass;
  label: string;
  on: boolean;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1",
        compact ? "h-12" : "h-14",
        on ? "text-s-ink" : "text-s-ink-2",
      )}
    >
      <Icon size={compact ? 22 : 24} strokeWidth={on ? 2.2 : 1.8} aria-hidden />
      {iconOnly ? null : (
        <span className={cn("font-body text-[12px] leading-none", on ? "font-semibold" : "font-normal")}>
          {label}
        </span>
      )}
    </span>
  );
}

/** A phone frame so each shell is judged at the size it will actually be seen at. */
function Phone({
  title,
  verdict,
  cost,
  children,
}: {
  title: string;
  verdict: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-[18px] font-semibold text-s-ink">{title}</h2>
      <p className="mt-1 max-w-[460px] font-body text-[14px] text-s-ink-2">{verdict}</p>
      <p className="mt-1 max-w-[460px] font-body text-[14px] text-s-ink-2">
        <span className="font-semibold text-s-ink">The cost:</span> {cost}
      </p>
      <div className="relative mt-4 h-[300px] w-[390px] overflow-hidden rounded-[20px] border border-s-border bg-white">
        {/* a slice of real page behind it, so each shell is judged over content and not over blank */}
        <div className="absolute inset-x-0 top-0 space-y-3 p-4">
          <div className="h-[43px] rounded-pill border border-s-border bg-white shadow-elevation-2" />
          <div className="flex gap-2">
            <span className="h-9 w-[70px] rounded-[40px] bg-s-bg-sunken" />
            <span className="h-9 w-[100px] rounded-[40px] bg-white shadow-whisper" />
            <span className="h-9 w-[92px] rounded-[40px] bg-white shadow-whisper" />
          </div>
          <div className="h-[120px] rounded-[16px] bg-s-bg-sunken" />
        </div>
        {children}
      </div>
    </section>
  );
}

export default function NavVariants() {
  return (
    <div className="mt-10">
      <Phone
        title="A. What ships right now"
        verdict="A flat bar across the full width, a hairline on top, four items with labels. This is the shipped component, measured: 57px tall, items 90x56, icon 24, label 12px."
        cost="He is right that it is basic. It is a rectangle glued to the edge, it never moves, and at the bottom of a white page the only thing separating it from the feed is a 1px line."
      >
        <nav className="absolute inset-x-0 bottom-0 border-t border-s-border bg-white">
          <div className="flex items-stretch justify-around px-2">
            {ITEMS.map((i, n) => (
              <Item key={i.key} Icon={i.Icon} label={i.label} on={n === 0} />
            ))}
          </div>
        </nav>
      </Phone>

      <Phone
        title="B. Floating pill (my pick)"
        verdict="The bar lifts off the edge: inset 16px each side, 16px from the bottom, fully rounded, real elevation under it. The page scrolls visibly underneath, which is what makes it read as a layer rather than a wall."
        cost="It covers a strip of content that a full-width bar also covers, but now with rounded corners, so the content peeking around the ends can look accidental unless the page keeps its bottom padding. And a floating bar is less obviously a bar, so the labels have to stay."
      >
        <nav className="absolute inset-x-4 bottom-4 rounded-full bg-white shadow-elevation-3">
          <div className="flex items-stretch justify-around px-2">
            {ITEMS.map((i, n) => (
              <Item key={i.key} Icon={i.Icon} label={i.label} on={n === 0} compact />
            ))}
          </div>
        </nav>
      </Phone>

      <Phone
        title="C. Floating capsule, icons only"
        verdict="Same lift as B, no labels, so it is a small object rather than a band. Widest reading of the page, most content visible."
        cost="Three unlabelled glyphs. A compass for Explore is not self-evident to a first-time visitor, and this is a marketplace where most people arrive once. Airbnb keeps its labels even at 10px, which is a real argument against this one."
      >
        <nav className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 shadow-elevation-3">
          <div className="flex items-stretch gap-1">
            {ITEMS.map((i, n) => (
              <span key={i.key} className="w-[64px]">
                <Item Icon={i.Icon} label={i.label} on={n === 0} compact iconOnly />
              </span>
            ))}
          </div>
        </nav>
      </Phone>

      <Phone
        title="D. Full width, but it gets out of the way on scroll"
        verdict="Shape stays flat and full width. The behaviour changes: it slides down out of sight while you scroll toward content and comes back the moment you scroll up. He said the scrolling is where it feels wrong, and this is the answer that changes the scrolling rather than the shape."
        cost="A control that disappears is a control someone has to hunt for. It also needs the hidden state to be genuinely reachable, so the return has to trigger on a small upward movement, not a large one."
      >
        <nav className="absolute inset-x-0 bottom-0 translate-y-[62%] border-t border-s-border bg-white transition-transform">
          <div className="flex items-stretch justify-around px-2">
            {ITEMS.map((i, n) => (
              <Item key={i.key} Icon={i.Icon} label={i.label} on={n === 0} />
            ))}
          </div>
        </nav>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-body text-[12px] text-s-ink-2">
          shown mid-hide
        </span>
      </Phone>
    </div>
  );
}
