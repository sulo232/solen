// NOT a client component, and the stray "use client" that used to sit here took the whole app
// down. Next.js forbids a browser-only file from exporting generateMetadata, and the failure is
// not local: it stops everything compiling, so every page in every language answered 500.
// This file uses no browser feature at all, no useState, no useEffect, no onClick, so the marker
// was wrong rather than load-bearing. It loads salon data on the server and awaits params, which
// is server work by definition.

// exists-check: `npm run exists team` (2026-07-24, this turn) , only hit is the dev-only
// /dev/pdp/team-all route + the SalonTeam/SalonTeamOverhaul/TeamAllOverhaul components (all
// referenced below, not duplicated) + the graveyard "ink black select button" entry (confirms
// the Select pill here must be white+hairline+shadow-whisper, never ink). No real
// salon/[slug]/team route exists , net-new leaf route. Server data via lib/salon-detail.ts's
// loadSalonDetailWithStatus (REUSED unchanged, the exact loader
// app/[locale]/salon/[slug]/page.tsx itself calls).
//
// mockup-ok: 2026-07-24 PORT (P10b, ref app/[locale]/dev/pdp/_overhaul/TeamAllOverhaul.tsx +
// app/[locale]/dev/pdp/team-all/page.tsx). The real "Select professional" picker SalonTeam's
// "Alle ansehen" now links to (was a dead click to the plain booking URL).
//
// Real i18n copy throughout (staffPicker.title + booking.staffStep.* , the SAME established
// German vocabulary the booking wizard's own StaffStep already ships, reused rather than
// invented). ONE back arrow only (not the dev mockup's redundant back+close pair, which only
// existed because the dev mockup's own "back" pointed at another dev route instead of the real
// PDP): this route is a task-step sub-view of the salon PDP (FooterGate.tsx already classifies
// it as one), which per the single-global-back doctrine keeps its own local back.
//
// "Select" pill = WHITE + hairline + shadow-whisper, NEVER ink (CONTROL_ELEVATION.md rung (F)
// ROW-COMMIT: a LIST of peer commits must not each carry the one-primary ink CTA, owner
// REJECTED an ink fill here 2026-07-24, REMOVED.md "ink black select button").
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Shuffle, Star } from "lucide-react";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import type { StaffMember } from "@/app/[locale]/_components/salon/_shared";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { Avatar } from "@/app/[locale]/_components/primitives";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [result, t] = await Promise.all([
    loadSalonDetailWithStatus(slug),
    getTranslations({ locale, namespace: "staffPicker" }),
  ]);
  return {
    title: result ? `${t("title")} , ${result.salon.name}` : t("title"),
  };
}

export default async function SalonTeamPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const tBack = await getTranslations("common");
  const { locale, slug } = await params;
  const result = await loadSalonDetailWithStatus(slug);
  if (!result) notFound();
  const { salon } = result;

  const [t, tStep] = await Promise.all([
    getTranslations({ locale, namespace: "staffPicker" }),
    getTranslations({ locale, namespace: "booking.staffStep" }),
  ]);

  const bookHref = (staffId?: string) =>
    `/${locale}/salon/${slug}/booking${staffId ? `?staff=${staffId}` : ""}`;

  return (
    <main className="min-h-screen bg-white pb-16">
      <div className="mx-auto max-w-[480px] px-4 pt-6">
        <Link
          href={`/${locale}/salon/${slug}#section-team`}
          aria-label={tBack("back")}
          className="grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.94] active:duration-[80ms] active:ease-glide"
        >
          <ArrowLeft size={20} strokeWidth={2.2} aria-hidden className="text-s-ink" />
        </Link>

        <h1 className="mt-5 font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
          {t("title")}
        </h1>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-4 rounded-[16px] border border-s-border bg-white p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-s-accent-pale">
              <Shuffle size={22} strokeWidth={2.2} aria-hidden className="text-s-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-body text-[17px] font-semibold text-s-ink">{tStep("any")}</div>
              <div className="font-body mt-0.5 text-[13px] text-s-ink-2">{tStep("maxAvailability")}</div>
            </div>
            <Link
              href={bookHref()}
              className="inline-flex h-11 shrink-0 items-center rounded-full border border-s-border bg-white px-5 font-body text-[14px] font-semibold text-s-ink shadow-whisper transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide hover:bg-s-bg-sunken"
            >
              {tStep("choose")}
            </Link>
          </div>

          {salon.staff.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
              slug={slug}
              locale={locale}
              bookHref={bookHref}
              viewProfileLabel={tStep("viewProfile")}
              chooseLabel={tStep("choose")}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function TeamCard({
  member,
  slug,
  locale,
  bookHref,
  viewProfileLabel,
  chooseLabel,
}: {
  member: StaffMember;
  slug: string;
  locale: string;
  bookHref: (id: string) => string;
  viewProfileLabel: string;
  chooseLabel: string;
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
            // Same enlarged pill grammar as SalonTeam.tsx (C3): 24px tall, ~10px horizontal
            // padding, 13px star, 14px/600 tabular value, white + hairline.
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
            {viewProfileLabel}
          </Link>
        </div>

        <Link
          href={bookHref(member.id)}
          className="inline-flex h-11 shrink-0 items-center rounded-full border border-s-border bg-white px-5 font-body text-[14px] font-semibold text-s-ink shadow-whisper transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide hover:bg-s-bg-sunken"
        >
          {chooseLabel}
        </Link>
      </div>
    </div>
  );
}
