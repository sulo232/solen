// Grounded-in: app/[locale]/_components/profile/AccountHub.tsx
"use client";

// exists-check: net-new vs app/[locale]/_components/profile/AccountHub.tsx (the file this one
// byte-copies). That component's inner Row/RowCard/GroupLabel helpers are not exported, so a
// font-size-only variant cannot be produced by importing and overriding it; this sibling file is
// this task's own mandated workaround for exactly that case (see the header comment below).
//
// Depicts: account hub rows, header, group labels -> app/[locale]/_components/profile/AccountHub.tsx
//   (real, live /profile screen; this file is a byte-copy of that exact component with only its
//   text-size classes changed, everything else, including its data shape and every row's real
//   destination route, is identical to the shipped component).
//
// BYTE-COPY of app/[locale]/_components/profile/AccountHub.tsx (real, unmodified export is used
// in the "Current" block on this page; that file's inner Row/RowCard/GroupLabel helpers are not
// exported, so a font-size-only variant cannot be produced by importing and overriding, per this
// task's own instruction: "byte-copy it into a sibling file inside your folder and say so in a
// comment"). Every class, prop, comment-derived structure and piece of logic below is identical
// to the source file at read time, with ONLY the arbitrary text-size values changed (VARY is
// font-size classes only, brief: "font-size classes only"). No weight, color, spacing, copy, icon
// or structural class was touched.
//
// GATE CONFLICT, surfaced not silently resolved (precedence chain: hooks/gates outrank LOCKFILE
// frozen literals): the design-contract "text size" row names an eyebrow value of eleven pixels
// as locked, and the first draft of this file snapped the header/group labels to that value on
// that basis. The live pre-edit-drift-gate (rule A19) refused it: text below a twelve-pixel floor
// fails the legibility check (LOCKFILE section 2.5), fix: use the Meta role (12-13px) or larger.
// Per this task's own rule ("a gate is part of the spec, not an obstacle") and the repo's own
// precedence chain, the gate wins here and the smaller eyebrow literal is not applied. The
// eyebrow role is folded onto the Meta value (12px) instead, which is also the gate's own
// suggested fix.
//
// The changes, each snapped to a value on the LOCKFILE.md design-contract "text size" ladder
// (name 14 / meta 12 / body 14 / CTA 15 / display anchor >=28; the smaller eyebrow value is not
// used, see conflict note above), never invented:
//   1. Header eyebrow "Konto" label: kept at its existing 12px value (LOCKFILE meta role, the
//      smaller eyebrow value blocked by the drift gate above; listed here for the ladder note).
//   2. GroupLabel ("Buchungen" / "Wallet" / "Persönlich" section labels): kept at its existing
//      12px value (same meta role as #1; already correct, listed so the mapping is complete).
//   3. Edit-profile link under the name: dropped from 14px to 12px (LOCKFILE meta role: "small
//      tappable metadata" is the exact class taste rule 3 names for a blue text link like this one).
//   4. Row sub-line (nextAppointment / wallet / coupons / stamps sublines) and the stamps
//      collected/needed count badge: dropped from 13px to 12px (LOCKFILE meta role, the same
//      secondary-info-line size already used by #1-3, so all four collapse onto one shared value).
//   5. Row label (the tappable row's primary text) and the Abmelden/sign-out button text:
//      dropped from a fractional 15.5px to 15px (LOCKFILE CTA role, "never <=13 on a button";
//      both are full-row/full-button tap targets, so both take the CTA step).
//   Untouched: the 28px name anchor (LOCKFILE display-anchor floor, already on the ladder,
//   already satisfies FLOORS LAW 6, so it is not one of this brief's four target sizes).
// Net effect: 5 distinct sizes in the current file (12, 13, 14, 15.5, 28) collapse to 3 (12, 15,
// 28), all pulled directly off the LOCKFILE ladder (as constrained by the live gate above), none
// invented, none eyeballed. 3 is under the brief's <=4 ceiling.

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Wallet as WalletIcon,
  TicketPercent,
  Heart,
  Stamp,
  Settings,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import type { AccountHubProps } from "@/app/[locale]/_components/profile/AccountHub";

export default function AccountHubProposed({
  locale,
  avatarUrl,
  displayName,
  nextAppointment,
  favoritesCount,
  wallet,
  activeVouchersCount,
  stamps,
}: AccountHubProps) {
  const t = useTranslations("profileHub");
  const tProfile = useTranslations("Profile");
  const p = (path: string) => `/${locale}${path}`;

  const bookingsSub = nextAppointment
    ? t("nextAppointmentOn", { date: nextAppointment.dateLabel, time: nextAppointment.timeLabel })
    : t("bookingsRowEmptySub");

  const walletSub =
    wallet.length === 0
      ? t("walletRowEmptySub")
      : wallet.length === 1
        ? `${t("payEndsIn")} ${wallet[0].last4}`
        : t("walletCardsCount", { count: wallet.length });

  const couponsSub =
    activeVouchersCount === null
      ? undefined
      : activeVouchersCount > 0
        ? t("couponsRowActive", { count: activeVouchersCount })
        : t("couponsRowEmptySub");

  const stampsSub = stamps ? t("stampsRowActive", { remaining: stamps.needed - stamps.collected }) : t("stampsRowEmptySub");

  return (
    <div className="mx-auto max-w-[560px] px-5 pb-16">
      <div className="pt-[18px]">
        <p className="mb-3.5 text-[12px] font-semibold text-s-ink-2">{t("hubSectionAccount")}</p>
        <div className="flex items-center gap-3.5">
          <Avatar src={avatarUrl} name={displayName} size={60} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
              {displayName}
            </h1>
            {/* change #3: 14 -> 12 */}
            <Link
              href={p("/profile/edit")}
              className="-my-1 inline-block py-1 text-[12px] font-medium text-s-accent underline-offset-2 hover:underline"
            >
              {t("editProfile")}
            </Link>
          </div>
        </div>
      </div>

      <GroupLabel>{t("statBookings")}</GroupLabel>
      <RowCard>
        <Row href={p("/profile/bookings")} icon={Calendar} label={t("statBookings")} sub={bookingsSub} />
      </RowCard>

      <GroupLabel>{t("tileWallet")}</GroupLabel>
      <RowCard>
        <Row href={p("/profile/settings/payment")} icon={WalletIcon} label={t("tileWallet")} sub={walletSub} />
        <Row href={p("/profile/vouchers")} icon={TicketPercent} label={t("vouchers")} sub={couponsSub} />
      </RowCard>

      <GroupLabel>{t("hubPersonal")}</GroupLabel>
      <RowCard>
        <Row href={p("/profile/haarprofil")} icon={HairGlyph} label={t("haarprofil")} />
        <Row
          href={p("/profile/favorites")}
          icon={Heart}
          iconClassName="text-s-ink"
          label={t("tabSaved")}
          sub={favoritesCount !== null ? tProfile("salonsCount", { count: favoritesCount }) : undefined}
        />
        <Row
          href={p("/profile/stamps")}
          icon={Stamp}
          label={t("tileStamps")}
          sub={stampsSub}
          end={
            stamps ? (
              // change #4: 13 -> 12
              <span className="text-[12px] font-medium tabular-nums text-s-ink">
                {stamps.collected}/{stamps.needed}
              </span>
            ) : undefined
          }
        />
      </RowCard>

      <RowCard className="mt-[26px]">
        <Row href={p("/profile/settings")} icon={Settings} label={t("settingsTitle")} />
      </RowCard>

      <form action="/api/auth/logout" method="post" className="mt-[30px] text-center">
        {/* change #5: 15.5 -> 15 */}
        <button
          type="submit"
          className="inline-flex items-center gap-[7px] text-[15px] font-medium text-s-error transition-opacity active:opacity-60"
        >
          <LogOut size={17} strokeWidth={1.9} aria-hidden />
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-[26px] px-1 text-[12px] font-semibold text-s-ink-2">{children}</p>;
}

function RowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white", className)}>{children}</div>;
}

function Row({
  href,
  icon: Icon,
  iconClassName,
  label,
  sub,
  end,
}: {
  href: string;
  icon: LucideIcon | typeof HairGlyph;
  iconClassName?: string;
  label: string;
  sub?: string;
  end?: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-[14px] px-4 py-[15px] transition-transform duration-150 active:scale-[0.99]">
      <span className="grid h-[22px] w-[22px] shrink-0 place-items-center text-s-ink">
        <Icon size={22} strokeWidth={2.2} className={iconClassName} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        {/* change #5: 15.5 -> 15 */}
        <span className="block font-heading text-[15px] font-medium tracking-[-0.01em] text-s-ink">{label}</span>
        {/* change #4: 13 -> 12 */}
        {sub ? <span className="mt-0.5 block truncate text-[12px] text-s-ink-2">{sub}</span> : null}
      </span>
      {end}
      <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink" aria-hidden />
    </Link>
  );
}

function HairGlyph({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: "url(/hair-patterns/wavy.png)",
        maskImage: "url(/hair-patterns/wavy.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
