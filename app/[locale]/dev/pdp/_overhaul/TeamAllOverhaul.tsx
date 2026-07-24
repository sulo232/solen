"use client";

// exists-check: `npm run exists team-all` + `npm run exists "select professional"` + `npm run
// exists "staff select"` (2026-07-24) = 0 hits each. The real Team section (SalonTeam.tsx /
// SalonTeamOverhaul.tsx) is a horizontal carousel with no "see all" DESTINATION (its See all
// pointed at the plain booking URL, not a stylist picker screen) , this is the net-new piece: a
// dedicated "Select professional" screen per the owner's Fresha reference. Grounded in the real
// stylist preselect the booking wizard already supports (`?staff=<id>`, validated server-side in
// app/[locale]/salon/[slug]/booking/page.tsx), so both "Select" affordances here are real
// navigations, not decorative dead buttons. Rating pill grammar (24px/13px star/14px value) is
// copy-pasted from SalonTeamOverhaul.tsx's own C3 sizing, not reinvented.

import Link from "next/link";
import { ArrowLeft, Shuffle, Star, X } from "lucide-react";
import type { StaffMember } from "../../../_components/salon/_shared";
import { MetaDot } from "../../../_components/salon/MetaDot";
import { Avatar } from "@/app/[locale]/_components/primitives";

export function TeamAllOverhaul({
  staff,
  slug,
  locale,
}: {
  staff: StaffMember[];
  slug: string;
  locale: string;
}) {
  const bookHref = (staffId?: string) =>
    `/${locale}/salon/${slug}/booking${staffId ? `?staff=${staffId}` : ""}`;

  return (
    <main className="min-h-screen bg-white pb-16">
      <div className="mx-auto max-w-[480px] px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}/dev/pdp/overhaul?salon=${slug}#section-team`}
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white transition-colors hover:bg-s-bg-sunken"
          >
            <ArrowLeft size={20} strokeWidth={2.1} aria-hidden className="text-s-ink" />
          </Link>
          <Link
            href={`/${locale}/salon/${slug}`}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white transition-colors hover:bg-s-bg-sunken"
          >
            <X size={20} strokeWidth={2.1} aria-hidden className="text-s-ink" />
          </Link>
        </div>

        <h1 className="mt-5 font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
          Select professional
        </h1>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-4 rounded-[16px] border border-s-border bg-white p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-s-accent-pale">
              <Shuffle size={22} strokeWidth={2} aria-hidden className="text-s-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-body text-[17px] font-semibold text-s-ink">No preference</div>
              <div className="font-body mt-0.5 text-[13px] text-s-ink-2">Maximum availability</div>
            </div>
            <Link
              href={bookHref()}
              className="inline-flex h-11 shrink-0 items-center rounded-full border border-s-border bg-white px-5 font-body text-[14px] font-semibold text-s-ink shadow-whisper transition-colors active:scale-[0.97] active:duration-[80ms] hover:bg-s-bg-sunken"
            >
              Select
            </Link>
          </div>

          {staff.map((member) => (
            <TeamAllCard key={member.id} member={member} slug={slug} locale={locale} bookHref={bookHref} />
          ))}
        </div>
      </div>
    </main>
  );
}

function TeamAllCard({
  member,
  slug,
  locale,
  bookHref,
}: {
  member: StaffMember;
  slug: string;
  locale: string;
  bookHref: (id: string) => string;
}) {
  const hasRating = (member.staff_review_count ?? 0) > 0;
  const rating = member.staff_average_rating;
  const showRating = hasRating && rating != null && rating > 0;

  const languages =
    member.languages && member.languages.length > 0
      ? member.languages.map((l) => l.toUpperCase()).join(" / ")
      : null;
  // "role" = the staff member's first specialty (real column, staff_members.specialties), not a
  // fabricated title. Omitted entirely when the salon never set specialties for this person.
  const role = member.specialties?.[0] ?? null;

  return (
    <div className="rounded-[16px] border border-s-border bg-white p-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar src={member.avatar_url} name={member.name} size={88} />
          {showRating && (
            // Same enlarged pill grammar as SalonTeamOverhaul.tsx (C3): 24px tall, ~10px
            // horizontal padding, 13px star, 14px/600 tabular value, white + hairline.
            <span className="absolute -bottom-1 left-1/2 inline-flex h-6 -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-s-border bg-white px-2.5 text-[14px] font-semibold leading-none tabular-nums text-s-ink shadow-elevation-1">
              <Star size={13} stroke="none" aria-hidden className="fill-s-star" />
              {(rating as number).toFixed(1)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-body text-[17px] font-semibold text-s-ink">{member.name}</div>
          {(languages || role) && (
            <div className="font-body mt-1 truncate whitespace-nowrap text-[13px] text-s-ink-2">
              {languages}
              {languages && role && <MetaDot />}
              {role}
            </div>
          )}
          <Link
            href={`/${locale}/salon/${slug}/staff/${member.id}`}
            className="font-body mt-1.5 inline-block text-[13px] font-semibold text-s-accent hover:opacity-80"
          >
            View profile
          </Link>
        </div>

        <Link
          href={bookHref(member.id)}
          className="inline-flex h-11 shrink-0 items-center rounded-full border border-s-border bg-white px-5 font-body text-[14px] font-semibold text-s-ink shadow-whisper transition-colors active:scale-[0.97] active:duration-[80ms] hover:bg-s-bg-sunken"
        >
          Select
        </Link>
      </div>
    </div>
  );
}
