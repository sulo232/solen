"use client";

import * as React from "react";
import { Star } from "lucide-react";
import type { StaffMember } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * SalonTeam — V3-D234 (2026-05-27, austerity rebuild per real Fresha capture).
 *
 * Spec captured at `public/_pixel-refs/fresha/salon-team/` via the
 * fresha-section-capture skill. Real Fresha values measured on LES MAINS
 * Basel @ 1440 desktop:
 *   - Section h2 "Team" 24/600 ink
 *   - "See all" link top-right, 16/400 purple (we use s-accent)
 *   - Card: 120×180, NO border, NO bg, padding 0, radius 8 (debug class)
 *   - Avatar: circle, 88px (mobile/desktop similar), bg #F5F5F5 lighter
 *     bg if no photo with initial letter centered in s-accent
 *   - Rating BELOW avatar (★ + "5.0"), 14/600 ink, small inline
 *   - Name 16/500 ink (matches s-ink)
 *   - Role 14/400 muted grey (s-ink-2) — for us: first specialty
 *
 * REMOVED from V2-D53.3:
 *   - The floating yellow rating BADGE overlay on the avatar bottom-left
 *     (Fresha puts rating BELOW the avatar, not on it)
 *   - The "DE / EN / FR" languages row (Fresha doesn't show languages on
 *     the team grid — they live in the booking flow when picking a stylist)
 *   - The ring-2 white + shadow-elevation-1 on the avatar (Fresha avatar
 *     is just a flat circle, no chrome)
 *
 * ADDED:
 *   - Rating row below avatar (small ★ + decimal)
 *   - Role line below name (first specialty as the "title")
 *   - "Alle ansehen" link top-right (Fresha "See all" parity)
 */
export function SalonTeam({
  staff,
  salonAverageRating,
}: {
  staff: StaffMember[];
  salonAverageRating: number | null;
}) {
  if (staff.length === 0) return null;

  return (
    <section id="section-team">
      {/* V3-D234: title row with "Alle ansehen" link top-right, h2 24/600 */}
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Team
        </h2>
        {/* Link goes nowhere meaningful yet — placeholder href; wire when
            full-team booking surface exists. */}
        {/* V3-D335 (overnight T3): decorative accent link label → ink-2 per §1.5 (decorative accent forbidden). */}
        <span className="font-body text-[14px] font-medium text-s-ink-2 md:text-[15px]">
          Alle ansehen
        </span>
      </div>

      {/* Horizontal carousel — fixed-width 120px cards, gap matches Fresha
          (24px column-gap). Negative-margin keeps left edge flush with the
          section padding. Snap-x for mobile thumb scroll. */}
      <div className="-mx-4 mt-5 flex gap-6 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
        {staff.map((s) => (
          <div key={s.id} className="w-[112px] shrink-0 snap-start md:w-[120px]">
            <TeamMember member={s} salonAverageRating={salonAverageRating} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamMember({
  member,
  salonAverageRating,
}: {
  member: StaffMember;
  salonAverageRating: number | null;
}) {
  const hasRating = (member.staff_review_count ?? 0) > 0;
  const displayRating = hasRating ? member.staff_average_rating : salonAverageRating;
  const showRating = displayRating !== null && displayRating !== undefined && displayRating > 0;

  // V3-D234: role = first specialty (Fresha uses "Founder" / role text;
  // we don't have a role field but specialties carry the same signal).
  const role = member.specialties?.[0] ?? null;

  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar — V3-D234: plain circle, no ring, no shadow. Bg s-bg-sunken
          for the empty-state container so the initial letter has contrast. */}
      <div className="grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-full bg-s-bg-sunken md:h-[88px] md:w-[88px]">
        {member.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatar_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          // V3-D335 (overnight T3): avatar fallback initial accent → ink-2 (decorative accent forbidden §1.5).
          <span className="font-display text-[32px] font-semibold text-s-ink-2">
            {member.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Rating — V3-D234: BELOW avatar (was floating badge ON avatar) */}
      {showRating && (
        <div className="mt-2.5 inline-flex items-center gap-1">
          <Star size={12} fill="#FFC32B" stroke="none" />
          <span className={cn("font-body text-[13px] font-normal text-s-ink-2", !hasRating && "opacity-70")}>
            {displayRating?.toFixed(1)}
          </span>
        </div>
      )}

      {/* Name */}
      <div className="font-body mt-2 text-[14px] font-medium leading-tight text-s-ink md:text-[15px]">
        {member.name}
      </div>

      {/* Role (first specialty) — V3-D234: replaces the "DE / EN / FR" lang row */}
      {role && (
        <div className="font-body mt-1 text-[12px] leading-snug text-s-ink-2 md:text-[13px]">
          {role}
        </div>
      )}
    </div>
  );
}
