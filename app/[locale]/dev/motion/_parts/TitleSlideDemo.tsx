"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.
// GROUNDED in, not a duplicate of: `dev/scroll-motion/_parts/CondenseBar.tsx` (the real
// scroll-linked condensing bar this demo miniaturises for a toggle-driven side-by-side, left
// untouched per this task's scope fence), `primitives/Avatar.tsx` (photo-or-initials circle,
// reused verbatim for the condensed bar's thumbnail so the src is never hardcoded, only ever the
// real `photoUrl` prop or Avatar's own initials fallback when it's null).

import * as React from "react";
import { motion } from "motion/react";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";
import { DemoCard } from "./DemoCard";
import { useDemoToggle } from "./useDemoToggle";
import { GLIDE_EASE, FAST_TIER_S, SLOW_TIER_S } from "./speeds";

/**
 * Interaction (f) , Title slide, the owner's own X recording: a page title sliding up into a
 * condensed top bar as content scrolls past. Owner correction honoured here (verbatim: "in the
 * frost, there isn't a picture thing that I literally told you to do"): the condensed bar carries
 * a small rounded thumbnail beside the name, via the real `Avatar` primitive so the image is
 * data-driven (the page's own `salon.cover_photo_url`, loaded server-side in page.tsx), never a
 * hardcoded src , Avatar itself falls back to an initials disc when the photo is null, never an
 * invented image.
 *
 * A toggle-driven miniature of the real scroll mapping (CondenseBar.tsx), not a live scroll
 * listener: `on` stands in for "scrolled past the title", so this demo replays with its siblings
 * off the same Play / Replay-all trigger instead of requiring the owner to scroll inside a card.
 *
 * This is new content sliding into view as the page settles into its browsing chrome, not a state
 * flip: the reveal tier fits, matching the owner's own reference which lands the title into the
 * bar as a settle, not a snap.
 */
function TitleStage({
  durationS,
  on,
  name,
  photoUrl,
  rating,
  reviewCount,
}: {
  durationS: number;
  on: boolean;
  name: string;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
}) {
  const transition = { duration: durationS, ease: [...GLIDE_EASE] as [number, number, number, number] };

  return (
    <div className="relative h-[104px] overflow-hidden rounded-xl border border-s-border bg-white">
      <motion.div
        className="absolute inset-x-0 top-0 z-10 flex h-12 items-center gap-2 border-b border-s-border bg-white/90 px-3 backdrop-blur"
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : -8 }}
        transition={transition}
      >
        <Avatar src={photoUrl} name={name} size={28} />
        <p className="min-w-0 flex-1 truncate font-body text-[13px] font-semibold text-s-ink">{name}</p>
      </motion.div>

      <motion.div
        className="absolute inset-x-0 top-14 px-3"
        animate={{ opacity: on ? 0 : 1, y: on ? -16 : 0 }}
        transition={transition}
      >
        <p className="truncate font-display text-[19px] font-semibold tracking-[-0.01em] text-s-ink">
          {name}
        </p>
        {rating != null && (
          <div className="mt-1 text-[12px] text-s-ink-2">
            <RatingStars value={rating} count={reviewCount ?? undefined} size="sm" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function TitleSlideDemo({
  globalTick,
  name,
  photoUrl,
  rating,
  reviewCount,
}: {
  globalTick: number;
  name: string;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
}) {
  const { on, toggle } = useDemoToggle(globalTick);

  return (
    <DemoCard
      index={6}
      title="Title slide"
      description="The owner's own X recording: the title sliding up into a condensed bar, thumbnail included."
      verdict="New chrome settling in as the page condenses, not a flip: reveal tier (300ms) fits, matching the settle in the owner's reference rather than a snap."
      onPlay={toggle}
    >
      <TitleStage durationS={FAST_TIER_S} on={on} name={name} photoUrl={photoUrl} rating={rating} reviewCount={reviewCount} />
      <TitleStage durationS={SLOW_TIER_S} on={on} name={name} photoUrl={photoUrl} rating={rating} reviewCount={reviewCount} />
    </DemoCard>
  );
}
