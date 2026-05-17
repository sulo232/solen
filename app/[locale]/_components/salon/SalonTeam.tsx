"use client";

import * as React from "react";
import { Star } from "lucide-react";
import type { StaffMember } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * SalonTeam — V2-D53.3 (2026-05-11).
 *
 * Team grid with floating rating badges per staff (Fresha 1:1).
 *
 * Layout:
 *   • Mobile: 3-col grid
 *   • Desktop: 4-col grid
 *
 * Each member card:
 *   • Large circular avatar (96px mobile, 128px desktop)
 *   • Floating yellow rating badge bottom-left of avatar
 *     - Per-staff data from `staff_ratings_view` (V2-D53.3 migration 080)
 *     - Falls back to salon avg with `opacity-60` when staff has no reviews
 *   • Name below
 *   • Languages line "DE / EN / RU / UK" (defaults "DE / EN" if empty)
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
      <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
        Team
      </h2>

      {/* V2-D53.3 fix #4: horizontal carousel per Fresha spec.
          Cards have fixed-width tiles so the next card peeks into view —
          cues swipe affordance. Negative-margin pulls the carousel edge to
          the page padding so cards align flush with section start. */}
      <div className="-mx-4 mt-5 flex gap-5 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:gap-7 md:px-0">
        {staff.map((s) => (
          <div key={s.id} className="w-[112px] shrink-0 snap-start md:w-[136px]">
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
  const displayRating = hasRating
    ? member.staff_average_rating
    : salonAverageRating;
  const showBadge = displayRating !== null && displayRating !== undefined && displayRating > 0;

  const langs = member.languages?.length
    ? member.languages.map((l) => l.toUpperCase()).slice(0, 4).join(" / ")
    : "DE / EN";

  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar with floating rating badge */}
      <div className="relative h-[88px] w-[88px] md:h-[112px] md:w-[112px]">
        <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-s-brand-subtle ring-2 ring-white shadow-[0_4px_12px_rgba(31,92,66,0.10)]">
          {member.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatar_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="font-display text-[28px] font-black text-s-brand md:text-[36px]">
              {member.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {showBadge && (
          <div
            className={cn(
              "font-body absolute bottom-0 left-0 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.12)]",
              !hasRating && "opacity-60"
            )}
          >
            <Star size={10} fill="#F3A864" stroke="none" />
            <span className="text-s-ink">{displayRating?.toFixed(1)}</span>
          </div>
        )}
      </div>

      <h3 className="font-body mt-3 text-[13px] font-semibold leading-tight text-s-ink md:text-[14px]">
        {member.name}
      </h3>
      <p className="font-body mt-1 text-[11px] uppercase tracking-[0.04em] text-s-ink-3 md:text-[12px]">
        {langs}
      </p>
    </div>
  );
}
