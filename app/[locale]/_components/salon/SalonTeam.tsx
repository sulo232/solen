"use client";

import * as React from "react";
import type { StaffMember } from "./_shared";
import { Avatar, SeeAllButton } from "@/app/[locale]/_components/primitives";
import { Sheet, SheetBody } from "@/app/[locale]/_components/primitives/Sheet";
import dynamic from "next/dynamic";

// Heavy client profile, loaded only when the sheet opens (owner 2026-06-11:
// staff profile = bottom-up sheet over the PDP, Fresha employee-profile pattern).
const StaffProfilePage = dynamic(() => import("@/components-legacy/staff/StaffProfilePage"), { ssr: false });

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
  const [openStaffId, setOpenStaffId] = React.useState<string | null>(null);
  const pushedRef = React.useRef(false);

  // Deep-link in: /salon/<slug>?staff_profile=<id> opens the sheet directly.
  React.useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("staff_profile");
    if (id) setOpenStaffId(id);
    const onPop = () =>
      setOpenStaffId(new URLSearchParams(window.location.search).get("staff_profile"));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openProfile = (id: string) => {
    // Desktop keeps the dedicated route (sheets are the mobile pattern, like Fresha).
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      window.location.assign(`/${locale}/salon/${slug}/staff/${id}`);
      return;
    }
    setOpenStaffId(id);
    const u = new URL(window.location.href);
    u.searchParams.set("staff_profile", id);
    window.history.pushState({ staffSheet: true }, "", u);
    pushedRef.current = true;
  };

  const closeProfile = () => {
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back(); // popstate clears the param + state
    } else {
      setOpenStaffId(null);
      const u = new URL(window.location.href);
      if (u.searchParams.has("staff_profile")) {
        u.searchParams.delete("staff_profile");
        window.history.replaceState({}, "", u);
      }
    }
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
      {/* Title row + "Alle ansehen" → opens the booking flow's stylist picker */}
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Team
        </h2>
        {/* mockup-ok: link variant, ink text + chevron per owner 2026-07-19 (Team sits next
            to the busy avatar-scroll row and read too big/unbalanced as a pill); Services and
            Reviews keep the default pill (booking-flow entry, owner-approved 2026-07-15). */}
        <SeeAllButton label="Alle ansehen" href={`/${locale}/salon/${slug}/booking`} variant="link" />
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
            className="group w-[104px] shrink-0 snap-start text-left md:w-[112px]"
          >
            <TeamMember member={s} />
          </button>
        ))}
      </div>

      {/* Staff profile as a bottom-up full sheet (mobile); desktop navigates to the route.
          ?staff_profile=<id> keeps it deep-linkable; browser back closes the sheet. */}
      <Sheet
        isOpen={!!openStaffId}
        onOpenChange={(o) => { if (!o) closeProfile(); }}
        height="full"
        aria-label="Mitarbeiterprofil"
      >
        <SheetBody className="p-0">
          {openStaffId && (
            <StaffProfilePage staffId={openStaffId} salonSlug={slug} onClose={closeProfile} />
          )}
        </SheetBody>
      </Sheet>
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

      {/* Spoken languages — owner 2026-07-24, reverses V3-D234's specialty subtitle */}
      {languages && (
        <div className="font-body mt-1 text-[12px] leading-snug text-s-ink-2 md:text-[13px]">
          {languages}
        </div>
      )}
    </div>
  );
}
