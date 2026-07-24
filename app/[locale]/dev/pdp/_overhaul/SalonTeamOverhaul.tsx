"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonTeam.tsx (real, unmodified).
// `npm run exists` (2026-07-24) confirms SalonTeam is the single PDP team section. This is a
// copy per the HARD LAW (never edit shipped components under _components/**); the ONLY change
// vs the shipped version is the rating pill size on the avatar (C3). Avatar size, name size,
// languages subline, section spacing, and the card grammar are all byte-identical to the
// shipped component , do not drift them.
//
// ROUND 4 (C3, owner Fresha reference, measured @3x -> pt): reference avatar ~92pt, rating pill
// ~61x23pt (pill height ~0.25x avatar diameter, width ~0.66x). Ours measured live: avatar 88x88,
// rating value 12px. TARGET (keep the 88px avatar so the section stays consistent with the rest
// of the page; only the pill grows): pill height 24px, horizontal padding ~10px (lands ~58-62px
// wide), star 13px, value 14px/600 tabular. The shared `Avatar` primitive's `badge` prop can't be
// resized without touching the shipped primitive (HARD LAW), so this copy renders the avatar
// WITHOUT that prop and layers its own bigger pill on top, same anchor (-bottom-1, centered).
//
// ROUND 5 (T5, owner: the "see all" was a DEAD CLICK, wire it up): "Alle ansehen" now navigates
// to the new /dev/pdp/team-all "Select professional" screen (was the plain booking URL, which
// never actually opened a stylist picker). Carries the current `?salon=` override through so the
// team-all screen reviews against the same salon this mockup page is loaded with.

import * as React from "react";
import { Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { StaffMember } from "../../../_components/salon/_shared";
import { Avatar, SeeAllButton } from "@/app/[locale]/_components/primitives";

export function SalonTeamOverhaul({
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
  void salonAverageRating; // kept for signature parity with the shipped component; unused there too

  const searchParams = useSearchParams();
  const salonOverride = searchParams?.get("salon");
  const teamAllHref = `/${locale}/dev/pdp/team-all${salonOverride ? `?salon=${salonOverride}` : ""}`;

  const openProfile = (id: string) => {
    window.location.assign(`/${locale}/salon/${slug}/staff/${id}`);
  };

  if (staff.length === 0) return null;

  return (
    <section
      id="section-team"
      className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Team
        </h2>
        <SeeAllButton label="Alle ansehen" href={teamAllHref} variant="link" />
      </div>

      <div className="mt-5 flex gap-5 overflow-x-auto pt-2 pb-3 snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {staff.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => openProfile(s.id)}
            className="group w-[104px] shrink-0 snap-start text-left md:w-[112px]"
          >
            <TeamMemberOverhaul member={s} />
          </button>
        ))}
      </div>
    </section>
  );
}

function TeamMemberOverhaul({ member }: { member: StaffMember }) {
  const hasRating = (member.staff_review_count ?? 0) > 0;
  const displayRating = member.staff_average_rating;
  const showRating = hasRating && displayRating !== null && displayRating !== undefined && displayRating > 0;

  const languages =
    member.languages && member.languages.length > 0
      ? member.languages.map((l) => l.toUpperCase()).join(" / ")
      : null;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative transition-transform duration-200 group-hover:scale-[1.04]">
        <Avatar src={member.avatar_url} name={member.name} size={88} />
        {showRating && (
          // C3: enlarged pill (24px tall, ~10px horizontal padding, 13px star, 14px/600
          // tabular value) replacing the shipped Avatar badge's 12px/12px version. Same
          // anchor as the shipped badge (-bottom-1, centered) so the overlap on the
          // avatar's bottom edge is unchanged, only the pill's own size grows.
          <span className="absolute -bottom-1 left-1/2 inline-flex h-6 -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-s-border bg-white px-2.5 text-[14px] font-semibold leading-none tabular-nums text-s-ink shadow-elevation-1">
            <Star size={13} stroke="none" aria-hidden className="fill-s-star" />
            {(displayRating as number).toFixed(1)}
          </span>
        )}
      </div>

      <div className={`font-body text-[14px] font-medium leading-tight text-s-ink md:text-[15px] ${showRating ? "mt-4" : "mt-2.5"}`}>
        {member.name}
      </div>

      {languages && (
        <div className="font-body mt-1 text-[12px] leading-snug text-s-ink-2 md:text-[13px]">
          {languages}
        </div>
      )}
    </div>
  );
}
