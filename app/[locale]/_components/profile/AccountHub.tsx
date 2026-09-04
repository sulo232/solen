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
  /** Real favorites count (Gespeichert row). null = the count query failed (unknown), distinct
   *  from a real, successful zero; the row renders with no count number in that case. */
  favoritesCount: number | null;
  /** Real saved Stripe cards (Wallet row). Empty array = none saved. */
  wallet: AccountHubWalletCard[];
  /** Real count of active (not expired, not redeemed, balance > 0) vouchers (Gutscheine row).
   *  null = the count query failed (unknown), distinct from a real, successful zero. */
  activeVouchersCount: number | null;
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
    activeVouchersCount !== null && activeVouchersCount > 0
      ? t("couponsRowActive", { count: activeVouchersCount })
      : t("couponsRowEmptySub");

  const stampsSub = stamps ? t("stampsRowActive", { remaining: stamps.needed - stamps.collected }) : t("stampsRowEmptySub");

  return (
    <div className="mx-auto max-w-[560px] px-5 pb-16">
      {/* Header: eyebrow + avatar + name. Name is the screen's one >=28px display anchor
          (FLOORS LAW 6); see the header comment for why 28px, not the mockup's measured 24px. */}
      <div className="pt-[18px]">
        <p className="mb-3.5 text-[12px] font-semibold text-s-ink-2">{t("hubSectionAccount")}</p>
        <div className="flex items-center gap-3.5">
          <Avatar src={avatarUrl} name={displayName} size={60} />
          <div className="min-w-0 flex-1">
            {/* mockup-ok: name row unchanged, 28px anchor preserved verbatim from the
                approved hub (FLOORS LAW 6). Only the wrapper is new, so the link can sit
                under the name. */}
            <h1 className="truncate font-heading text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
              {displayName}
            </h1>
            {/* E4 (2026-08-05): the hub had NO route to the editor at all , the box was
                ticked from inference and grep found zero `profile/edit` references here.
                mockup-ok: text link, so blue s-accent is the LOCKED treatment for a small
                clickable bit (design contract "link" row, taste rule 3). Destination is the
                EXISTING app/[locale]/profile/edit/page.tsx, not a new editor. */}
            <Link
              href={p("/profile/edit")}
              // mockup-ok: `-my-1 py-1` grows the hit box from a measured 17px to 25px to
              // clear WCAG 2.5.8 Target Size (24px AA, precedence tier 2) while the negative
              // margin keeps the rendered layout byte-identical. No visual change.
              className="-my-1 inline-block py-1 text-[14px] font-medium text-s-accent underline-offset-2 hover:underline"
            >
              {t("editProfile")}
            </Link>
          </div>
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
        {/* mockup-ok: subline dropped per account-hub-rows.html, approved 2026-08-05 ("i dont
            think every settings needs explanation"). "Haartyp, Länge, Allergien" only listed
            what a hair profile contains, so it carried no data the label did not already
            imply. Copy economy rule 1. The five sublines wired to live data all stay. */}
        <Row href={p("/profile/haarprofil")} icon={HairGlyph} label={t("haarprofil")} />
        <Row
          href={p("/profile/favorites")}
          icon={Heart}
          // 2026-08-03, owner: "remove pink sh bit looks so out of place", and again on seeing it
          // survive: "why is heart icon pink n how did u not flag it ever". He is right twice. It
          // was removed from a MOCKUP and never from this component, so the live page kept it.
          // Measured on IMG_6900: Airbnb's account rows carry no chromatic icon at all, every glyph
          // is ink. #FF3366 stays the save-heart token everywhere it means "saved by you"; on a
          // navigation row it is decoration, and this row is navigation.
          iconClassName="text-s-ink" // mockup-ok: account-row glyphs are ink, airbnb--profile-list.md IMG_6900
          label={t("tabSaved")}
          // favoritesCount null = the count query failed; omit the subline rather than
          // fabricate "0 Salons" (regression of GAP_FIXES #47's countOf() fix). Same row,
          // same label, same link, only the count number is withheld.
          sub={favoritesCount !== null ? tProfile("salonsCount", { count: favoritesCount }) : undefined}
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
        {/* mockup-ok: subline dropped, same rule as the hair row above. "Sprache,
            Mitteilungen, Datenschutz" only listed what settings contains. */}
        <Row href={p("/profile/settings")} icon={Settings} label={t("settingsTitle")} />
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
  // 2026-08-03, owner: "why the fuck is this still boxing?" He is right, and this is not a taste
  // call, it is our OWN law being broken. LOCKFILE.md:543-560 names "an account hub" as a surface
  // that gets NO container, and says "never both" a box and a per-row hairline. This line shipped
  // both: `rounded-[24px] border border-s-border` AND `divide-y`. Airbnb's account rows
  // independently measure the same way, 0 containers and one rule only at a group boundary
  // (IMG_6900, _design-system/references/airbnb--profile-list.md).
  // Rows now sit on white; the group boundary is carried by the group's own top border below.
  return <div className={cn("bg-white", className)}>{children}</div>; // mockup-ok: LOCKFILE.md:543-560, account hub takes no container
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
      {/* 2026-08-03, owner: "the icon sh remove" and "that weird gray and gray thingy". Measured on
          IMG_6900: Airbnb's rows carry a BARE glyph, ink bbox 21-23pt, sitting on white with no
          tile behind it. A 38x38 `bg-s-bg-sunken` square behind every icon is also the dead-grey
          FLOORS LAW 4 forbids. Tile removed, glyph kept at the reference's own size. */}
      <span className="grid h-[22px] w-[22px] shrink-0 place-items-center text-s-ink"> {/* mockup-ok: bare glyph, no tile, per airbnb--profile-list.md IMG_6900 */}
        {/* mockup-ok: 19 -> 22 per public/_mockups/improve/account-hub-rows.html, approved
            2026-08-05 ("icon should be abit bigger"). Not a picked number: the captured
            reference measures 17.3-22.7pt per account-list glyph
            (airbnb--profile-list.md:52,83), so 19 sat at the bottom of the band, and the
            wrapper span above already reserves exactly 22px. */}
        <Icon size={22} strokeWidth={2.2} className={iconClassName} aria-hidden />
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
// mockup-ok: default follows the row glyph to 22 (was 19). Row always passes an explicit
// size, so this changes nothing today, but a stale 19 here is exactly the drift FLOORS LAW 8
// names: the same glyph rendering one size in one place and another size elsewhere.
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
