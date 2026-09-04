"use client";

import * as React from "react";
import { Star } from "lucide-react";
import type { StaffMember } from "./_shared";
import { Avatar, SeeAllButton } from "@/app/[locale]/_components/primitives";
import { useTranslations } from "next-intl";

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
 *   - Subtitle 14/400 muted grey (s-ink-2) — for us: spoken languages
 *
 * REMOVED from V2-D53.3:
 *   - The floating yellow rating BADGE overlay on the avatar bottom-left
 *     (Fresha puts rating BELOW the avatar, not on it)
 *   - The ring-2 white + shadow-elevation-1 on the avatar (Fresha avatar
 *     is just a flat circle, no chrome)
 *
 * Owner 2026-07-24: REVERSES the languages→specialty swap this file made at
 * V3-D234 ("the DE/EN/FR lang row" was removed then in favor of "first
 * specialty" as the subtitle). Per the current owner goal, specialties are no
 * longer shown as the subtitle at all — spoken languages are, formatted as
 * uppercase 2-letter codes joined by " / " (e.g. "EN / JP / DE"), sourced from
 * staff_members.languages. Empty/null languages render nothing (no fallback).
 *
 * ADDED:
 *   - Rating row below avatar (small ★ + decimal)
 *   - Languages line below name (spoken languages as the subtitle)
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
  const t = useTranslations("salonDetail");
  const openProfile = (id: string) => {
    // Owner 2026-07-24: a full focused profile PAGE, not a bottom-sheet over the PDP
    // ("I wish I didn't do that... just a focus on the person, not the bottom-sheet thing").
    // Both mobile + desktop navigate to the dedicated staff route now; the old in-place
    // Sheet (and its ?staff_profile= deep-link) is removed so tapping never slides a sheet up.
    window.location.assign(`/${locale}/salon/${slug}/staff/${id}`);
  };

  if (staff.length === 0) return null;

  return (
    <section
      id="section-team"
      // mockup-ok: drift fix to the LOCKED §427 grouped list-card grammar, byte-identical to
      // SalonServices.tsx's already-shipped `<ul>` wrapper class string (rounded-[24px] border
      // border-s-border bg-white shadow-whisper), no new appearance introduced.
      className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7"
    >
      {/* Title row + the see-all control → the real stylist picker.
          items-center, not items-baseline: a circle has no baseline to sit on, so with
          items-baseline the 44px cell aligns its own text baseline to the heading's and hangs
          below the row. Same note the home page's SectionTitle carries for the same reason. */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {t("team")}
        </h2>
        {/* mockup-ok: owner 2026-08-15, verbatim, pointing at the home page: "I want, like, the
            [see-all] to be just, like ... a circle and then gray sink and then ink ... an arrow
            inside. Look at ... how in the home page it is, you know, on the arrow." So the text
            link plus chevron this row used to carry (the 2026-07-19 "link" variant, kept because
            a pill out-weighed the heading next to the busy avatar row) becomes the SAME circle
            the home page already ships, composed from the SeeAllButton primitive rather than
            redrawn here (FLOORS LAW 9). The label survives as the accessible name.
            href , 2026-07-24 PORT (T5): the real "Select professional" picker, unchanged. */}
        <SeeAllButton label="Alle ansehen" href={`/${locale}/salon/${slug}/team`} variant="circle" />
      </div>

      {/* Horizontal carousel — tapping a stylist opens their individual profile
          (Fresha); "Alle ansehen" above opens the booking flow. Cards clip at the
          panel's rounded edge as a subtle "scroll for more" cue. */}
      <div className="mt-5 flex gap-5 overflow-x-auto pt-2 pb-3 snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {staff.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => openProfile(s.id)}
            className="group w-[104px] shrink-0 snap-start text-left transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide md:w-[112px]"
          >
            <TeamMember member={s} />
          </button>
        ))}
      </div>
    </section>
  );
}

function TeamMember({
  member,
}: {
  member: StaffMember;
}) {
  // B15 (PSYCHOLOGY law 6): a personal rating badge must never substitute the
  // salon's blended rating for a staff member with zero personal reviews, that
  // reads as this stylist's own score when it isn't. Omit the badge instead.
  const hasRating = (member.staff_review_count ?? 0) > 0;
  const displayRating = member.staff_average_rating;
  const showRating = hasRating && displayRating !== null && displayRating !== undefined && displayRating > 0;

  // Owner 2026-07-24: subtitle is spoken languages (uppercase codes, "EN / JP / DE"),
  // NOT specialties — reverses V3-D234's "first specialty as role text" swap. No
  // fallback text when languages is empty/null (per the owner's explicit instruction).
  const languages =
    member.languages && member.languages.length > 0
      ? member.languages.map((l) => l.toUpperCase()).join(" / ")
      : null;

  return (
    <div className="flex flex-col items-center text-center">
      {/* mockup-ok: avatar rating pill enlarged (2026-07-24 PORT, ref
          _overhaul/SalonTeamOverhaul.tsx C3, owner Fresha reference): 24px tall, ~10px
          horizontal padding, star 13px, value 14px/600 tabular, white + hairline +
          shadow-elevation-1. The shared Avatar primitive's `badge` prop can't be resized
          without touching that shipped primitive, so this renders the avatar WITHOUT it
          and layers its own bigger pill on top, same -bottom-1 centered anchor as the
          primitive's own badge. Avatar itself stays 88px. */}
      <div className="relative transition-transform duration-150 group-hover:scale-[1.04]">
        <Avatar src={member.avatar_url} name={member.name} size={88} />
        {showRating && (
          <span className="absolute -bottom-1 left-1/2 inline-flex h-6 -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-s-border bg-white px-2.5 text-[14px] font-semibold leading-none tabular-nums text-s-ink shadow-elevation-1">
            <Star size={13} stroke="none" aria-hidden className="fill-s-star" />
            {(displayRating as number).toFixed(1)}
          </span>
        )}
      </div>

      {/* Name */}
      <div className={`font-body text-[14px] font-medium leading-tight text-s-ink md:text-[15px] ${showRating ? "mt-4" : "mt-2.5"}`}>
        {member.name}
      </div>

      {/* Spoken languages — owner 2026-07-24, reverses V3-D234's specialty subtitle */}
      {languages && (
        <div className="font-body mt-1 text-[12px] leading-snug text-s-ink-2 md:text-[13px]">
          {languages}
        </div>
      )}
    </div>
  );
}
