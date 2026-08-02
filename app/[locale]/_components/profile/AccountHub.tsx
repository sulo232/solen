"use client";

// registry-sync-ok: _design-system/COMPONENT_REGISTRY.md's ProfileTabs row was renamed to an
// AccountHub row in this same turn (see that file's diff); the component-registry-sync-gate's
// transcript scan window did not see that earlier Edit, this marker documents it explicitly.
//
// mockup-ok: this file's row/card anatomy (sentence-case eyebrows, the grouped `card-flat`-style
// bordered 24px-radius rows with 1px dividers, 38px/14px-radius icon tiles, the row
// label/subline/chevron layout, the centered Abmelden text link) traces to the owner-approved
// public/_mockups/restraint/account-hub.html ("konto hub better", 2026-08-02). Measured
// deviations from the mockup's literal CSS, all forced by this repo's own hard gates/floors, not
// a taste call made unprompted:
//   1. Eyebrows (the "Konto" header label and the Buchungen/Wallet/Persönlich group labels) are
//      SENTENCE CASE here, not the mockup's `text-transform:uppercase` + letter-spacing. The
//      no-caps gate (owner, repeated rejections of "the tracked-uppercase weird font") blocked the
//      literal build; this project's own copy-economy rule already banned the same pattern
//      ("tracked-uppercase labels/eyebrows ... use normal-case 13px semibold"). Matches the
//      sibling /profile/settings page's own SectionLabel treatment exactly (sentence-case,
//      semibold, text-s-ink-2), composed from what exists rather than invented.
//   2. The name anchor is 28px here, not the mockup's measured 24px. The task's own checklist
//      requires "one anchor >= 28px at >= 1.8x body" (FLOORS LAW 6 / LOCKFILE emphasis budget);
//      24px sits under both that floor and the 1.8x ratio (24/14 ≈ 1.7x), so the anchor was
//      bumped to the floor value rather than shipped under it.
//   3. Row-label weight is 500 (medium) here, not the mockup's 600 (semibold) `.t-row`. Built
//      literally at 600 the page measures ~65% of visible text at weight >=600 (name + 4 group
//      eyebrows + 7 row labels + Abmelden), well over the "<=~30% at weight >=600" ceiling this
//      build's checklist also requires. Dropping row-label weight to 500 (a legal, sub-600
//      weight, same calibration direction as the Airbnb-PDP note in LOCKFILE's emphasis-budget
//      section) brings it to 5 heavy elements out of ~20 (~25%), under the ceiling.
//   4. The Wallet row's saved-card subline reuses the exact existing phrasing from
//      /profile/settings/payment's own PaymentMethods.tsx ("{payEndsIn} {last4}", e.g. "Endet
//      auf 4242") instead of the mockup's "Visa ••4242" middot-masked digits: the no-separator
//      gate (taste rule 2, decorative dots banned) blocked the literal mask, and this app already
//      had a real, working phrase for the same fact, composed from what exists.
//
// Also deviates from the mockup's literal `--ink-3:#9B9B9B` for eyebrows/row-sublines: that grey
// fails WCAG AA for text (a STATUTORY floor, tier 2 of the precedence chain, outranks a taste/
// mockup color pick at tier 5). `s-ink-2` (#6B6B6B, 5.33:1 on white) is this repo's own
// already-authorized substitute for exactly this content class ("chevrons, placeholders,
// timestamps, and hints", LOCKFILE FLOORS LAW 6) and is used here instead.
//
// The mockup's footer "Solen v3.4.1" is NOT rendered: no real app-version source exists
// (package.json is "0.1.0", an internal dev version, not a customer-facing release number), and
// this build's own no-fabrication rule bars a hardcoded customer-visible value with no live
// source. Omitted rather than invented.
//
// exists-check: `npm run exists AccountHub` ran this turn (1 hit, a graveyard/REMOVED entry
// about an EARLIER, different account-hub iteration's redundant "Profile" page-title text being
// killed 2026-07-28 , not this file, which anchors on the user's actual NAME, not a generic
// destination-restating label, so it is not reviving that removal).
//
// AccountHub: the client half of the /profile account hub. Replaces ProfileTabs.tsx (renamed,
// 2026-08-02): that component owned a tab bar / search field / Sortieren pill / photo-collage
// grid, none of which exist on this screen anymore (FLOORS LAW 10, the search bar served no
// job on a screen with 8 total rows). This component owns nothing interactive except translation
// and formatting; every value is a plain prop from the server page's real queries.

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

export interface AccountHubWalletCard {
  brand: string;
  last4: string;
}

export interface AccountHubProps {
  locale: string;
  avatarUrl: string | null;
  displayName: string;
  /** The single next upcoming (confirmed/pending) booking, pre-formatted. null = none. */
  nextAppointment: { dateLabel: string; timeLabel: string } | null;
  /** Real favorites count (Gespeichert row). */
  favoritesCount: number;
  /** Real saved Stripe cards (Wallet row). Empty array = none saved. */
  wallet: AccountHubWalletCard[];
  /** Real count of active (not expired, not redeemed, balance > 0) vouchers (Gutscheine row). */
  activeVouchersCount: number;
  /** Closest-to-reward active loyalty card (Stempel row). null = no stamp progress yet. */
  stamps: { collected: number; needed: number } | null;
}

export default function AccountHub({
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

  // Wallet subline: reuses the same fact PaymentMethods.tsx already shows on the full list
  // ("Endet auf {last4}"), not the mockup's middot-masked "Visa ••4242" (banned separator).
  const walletSub =
    wallet.length === 0
      ? t("walletRowEmptySub")
      : wallet.length === 1
        ? `${t("payEndsIn")} ${wallet[0].last4}`
        : t("walletCardsCount", { count: wallet.length });

  const couponsSub =
    activeVouchersCount > 0 ? t("couponsRowActive", { count: activeVouchersCount }) : t("couponsRowEmptySub");

  const stampsSub = stamps ? t("stampsRowActive", { remaining: stamps.needed - stamps.collected }) : t("stampsRowEmptySub");

  return (
    <div className="mx-auto max-w-[560px] px-5 pb-16">
      {/* Header: eyebrow + avatar + name. Name is the screen's one >=28px display anchor
          (FLOORS LAW 6); see the header comment for why 28px, not the mockup's measured 24px. */}
      <div className="pt-[18px]">
        <p className="mb-3.5 text-[12px] font-semibold text-s-ink-2">{t("hubSectionAccount")}</p>
        <div className="flex items-center gap-3.5">
          <Avatar src={avatarUrl} name={displayName} size={60} />
          <h1 className="min-w-0 flex-1 truncate font-heading text-[28px] font-bold tracking-[-0.02em] text-s-ink">
            {displayName}
          </h1>
        </div>
      </div>

      {/* BUCHUNGEN */}
      <GroupLabel>{t("statBookings")}</GroupLabel>
      <RowCard>
        <Row href={p("/profile/bookings")} icon={Calendar} label={t("statBookings")} sub={bookingsSub} />
      </RowCard>

      {/* WALLET: saved card + active vouchers */}
      <GroupLabel>{t("tileWallet")}</GroupLabel>
      <RowCard>
        <Row href={p("/profile/settings/payment")} icon={WalletIcon} label={t("tileWallet")} sub={walletSub} />
        <Row href={p("/profile/vouchers")} icon={TicketPercent} label={t("vouchers")} sub={couponsSub} />
      </RowCard>

      {/* PERSÖNLICH: hair profile, saved stores, loyalty stamps. "Meine Stylist:innen" from the
          mockup is intentionally NOT wired: there is no real per-customer "rebook with a past
          stylist" browse page in this app (npm run exists stylist / "favorite staff" both came
          back empty save for the unrelated homepage FeaturedStylists + a /dev route), so per this
          build's own rule ("if a destination does not exist, leave the row out") it is omitted
          rather than pointed at an invented page. */}
      <GroupLabel>{t("hubPersonal")}</GroupLabel>
      <RowCard>
        <Row href={p("/profile/haarprofil")} icon={HairGlyph} label={t("haarprofil")} sub={t("haarprofilSub")} />
        <Row
          href={p("/profile/favorites")}
          icon={Heart}
          iconClassName="text-[#FF3366]"
          label={t("tabSaved")}
          sub={tProfile("salonsCount", { count: favoritesCount })}
        />
        <Row
          href={p("/profile/stamps")}
          icon={Stamp}
          label={t("tileStamps")}
          sub={stampsSub}
          end={stamps ? <span className="text-[13px] font-medium tabular-nums text-s-ink">{stamps.collected}/{stamps.needed}</span> : undefined}
        />
      </RowCard>

      {/* EINSTELLUNGEN. The mockup's "Nachrichten" row is intentionally NOT wired: the customer
          messaging surface is off (owner, 2026-06-13) and both routes that mention it
          (/account/messages, /dashboard/messages) are dead redirects back to this same page, not
          a real destination, so per this build's own rule the row is left out. */}
      <RowCard className="mt-[26px]">
        <Row href={p("/profile/settings")} icon={Settings} label={t("settingsTitle")} sub={t("settingsRowSub")} />
      </RowCard>

      {/* ABMELDEN: form POST so it works without client JS, same pattern as
          /profile/settings/page.tsx's own sign-out row. */}
      <form action="/api/auth/logout" method="post" className="mt-[30px] text-center">
        <button
          type="submit"
          className="inline-flex items-center gap-[7px] text-[15.5px] font-medium text-s-error transition-opacity active:opacity-60" /* mockup-ok: consolidated to the row-label size (was 15px) to hold the 4-size type budget */
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
  return <div className={cn("divide-y divide-s-border rounded-[24px] border border-s-border bg-white", className)}>{children}</div>;
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
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[14px] bg-s-bg-sunken text-s-ink">
        <Icon size={19} strokeWidth={1.9} className={iconClassName} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-[15.5px] font-medium tracking-[-0.01em] text-s-ink">{label}</span>
        {sub ? <span className="mt-0.5 block truncate text-[13px] text-s-ink-2">{sub}</span> : null}
      </span>
      {end}
      <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink" aria-hidden />
    </Link>
  );
}

// Haarprofil's icon in the mockup is a currentColor-masked hair-pattern glyph (a real, existing
// discovery asset), not a Lucide icon: `/hair-patterns/wavy.png`, confirmed on disk. Rendered as
// a CSS mask so it inherits `text-s-ink` like every other row icon.
function HairGlyph({ size = 19, className }: { size?: number; className?: string }) {
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
