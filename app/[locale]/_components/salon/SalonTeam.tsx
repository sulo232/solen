"use client";

import * as React from "react";
import Link from "next/link";
import type { StaffMember } from "./_shared";
import { Avatar } from "@/app/[locale]/_components/primitives";

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
  slug,
  locale,
}: {
  staff: StaffMember[];
  salonAverageRating: number | null;
  slug: string;
  locale: string;
}) {
  if (staff.length === 0) return null;

  return (
    <section
      id="section-team"
      className="overflow-hidden rounded-3xl bg-white shadow-float p-5 md:p-7"
    >
      {/* Title row + "Alle ansehen" → opens the booking flow's stylist picker */}
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Team
        </h2>
        <Link
          href={`/${locale}/salon/${slug}/booking`}
          className="font-body text-[14px] font-medium text-s-accent transition-opacity hover:opacity-80 md:text-[15px]"
        >
          Alle ansehen
        </Link>
      </div>

      {/* Horizontal carousel — tapping a stylist opens their individual profile
          (Fresha); "Alle ansehen" above opens the booking flow. Cards clip at the
          panel's rounded edge as a subtle "scroll for more" cue. */}
      <div className="mt-5 flex gap-5 overflow-x-auto pt-2 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {staff.map((s) => (
          <Link
            key={s.id}
            href={`/${locale}/salon/${slug}/staff/${s.id}`}
            className="group w-[104px] shrink-0 snap-start md:w-[112px]"
          >
            <TeamMember member={s} salonAverageRating={salonAverageRating} />
          </Link>
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
      {/* Avatar + Fresha rating badge folded into the Avatar primitive
          (V3-D234 rating-below pattern → primitive badge at bottom edge). */}
      <div className="relative transition-transform duration-200 group-hover:scale-[1.04]">
        <Avatar
          src={member.avatar_url}
          name={member.name}
          size={88}
          badge={showRating ? { rating: displayRating as number } : undefined}
        />
      </div>

      {/* Name */}
      <div className={`font-body text-[14px] font-medium leading-tight text-s-ink md:text-[15px] ${showRating ? "mt-4" : "mt-2.5"}`}>
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
