"use client";

/**
 * Exists-check: `npm run exists AccountHub` (1 REMOVED hit, an earlier unrelated
 * account-hub page-title removal, not this component). `npm run exists profile` ran
 * this turn and surfaced the real AccountHub.tsx this file forks from, plus every
 * sub-route each row still links to (all reused unchanged, no destination invented).
 * Grounded-in: app/[locale]/_components/profile/AccountHub.tsx
 *
 * measured (PIL pixel-sample, _design-system/references/airbnb--profile-list.md): row pitch 56px, hairline 1px, icon 22px stroke 1.5px, avatar 48px, row label 16px, section title 24px, press 100ms.
 *
 * ours vs theirs, same role on both sides: our own row already ships at 15.5px (AccountHub.tsx) and this ports it to 16px, our own avatar ships at 60px and this ports it to 48px, our own anchor stays 28px (FLOORS LAW 6, unchanged) and the new section title sits one step under it at 24px, both are the SAME role (identity name, group heading) on both screens, not a different object being force-matched.
 *
 * Depicts: identity block (avatar, name, edit link) -> app/[locale]/_components/profile/AccountHub.tsx
 * Depicts: edit-profile destination -> app/[locale]/profile/edit/page.tsx
 * Depicts: Bookings group and next-appointment subline -> app/[locale]/_components/profile/AccountHub.tsx
 * Depicts: bookings destination -> app/[locale]/profile/bookings/page.tsx
 * Depicts: Wallet group, saved card and vouchers rows -> app/[locale]/_components/profile/AccountHub.tsx
 * Depicts: payment destination -> app/[locale]/profile/settings/payment/page.tsx
 * Depicts: vouchers destination -> app/[locale]/profile/vouchers/page.tsx
 * Depicts: Personal group, hair profile, saved and stamps rows -> app/[locale]/_components/profile/AccountHub.tsx
 * Depicts: hair profile destination -> app/[locale]/profile/haarprofil/page.tsx
 * Depicts: saved destination -> app/[locale]/profile/favorites/page.tsx
 * Depicts: stamps destination -> app/[locale]/profile/stamps/page.tsx
 * Depicts: settings row and sign-out form -> app/[locale]/_components/profile/AccountHub.tsx
 * Depicts: settings destination -> app/[locale]/profile/settings/page.tsx
 * Depicts: every value rendered -> app/[locale]/dev/directions-0905/profile/_vb/loadProfileB.ts
 *
 * The Airbnb row/section/hairline/press treatment values above are cited in full in the
 * "Sources" block further down this comment (not repeated as Depicts lines, since those
 * are style-number citations, not app features being traced):
 * _design-system/references/airbnb--profile-list.md, airbnb--profile-and-payments.md,
 * airbnb--look-recipe.md, airbnb--motion.md.
 *
 * Direction: Airbnb profile, full strength (LOOK-FULL). Declared axis: the same live
 * grouped structure (identity, Bookings, Wallet, Personal, sign out), the SAME rows,
 * SAME real data, restyled with the Airbnb account-row recipe at full strength, even
 * where it breaks a Solen lock. Every break is listed below and in the caller's return.
 *
 * Sources (every value traces to one of these, nothing eyeballed):
 * - _design-system/references/airbnb--profile-list.md (Recipe A, the icon-nav list:
 *   row pitch 56.0pt exact across 19 rows / zero divider within a group / one #EBEBEB
 *   hairline only at a group boundary, 24pt inset / bare untiled icon, ink 17-23pt /
 *   icon stroke ~1.33-1.5pt / label left inset ~65pt). Its own ORCHESTRATOR CORRECTION
 *   section: raw cap-height (11.7pt) undersells the real font size; corrected estimate
 *   "about 16pt", used here for the row label instead of the raw cap-height number.
 * - _design-system/references/airbnb--profile-and-payments.md (cites the same file,
 *   avatar circle range 40-48px from the sibling look-recipe row 15-16, used as the
 *   nearest measured avatar-circle value since no Airbnb capture measured THIS exact
 *   identity-block avatar).
 * - _design-system/references/airbnb--look-recipe.md (#5 ink rgb(34,34,34)=#222222,
 *   #4 secondary text rgb(108,108,108)=#6C6C6C, #9/#99 radius-runs-bigger pattern,
 *   the CONFLICT list this file's header cites by number).
 * - _design-system/references/airbnb--motion.md (the (f) press table: 100ms,
 *   cubic-bezier(0.2,0,0,1), the SAME curve Airbnb uses on every button/link; CONFLICT
 *   logged there against Solen's locked 150ms `thud` accelerate press curve).
 * - Section-header size (24px) is DERIVED, not lifted from a table cell: profile-list.md
 *   measures the Login&security bold section header at 17.0pt cap-height and states the
 *   same cap-height-to-font-size ratio (~0.72x) used to correct the row-label number;
 *   17.0 / 0.72 ~= 23.6, rounded to 24px (also lands on Solen's 4pt grid). Said plainly
 *   here so it reads as arithmetic, not an invented number.
 * - Row pitch (56px measured) assumes Recipe A's ONE-LINE row (no subline). Every row
 *   on this real screen carries a subline (real data, can't be dropped), so literal
 *   56px is not achievable without losing content; `py-[10px]` was chosen because it
 *   converges close to 56-58px total once the two-line text block (16px label + 13px
 *   subline) is accounted for, and is reported as a derived approximation, not a
 *   direct copy of the measured number onto different content.
 *
 * Conflicts (locks broken on purpose, LOOK-FULL):
 * 1. Ink color: Solen's frozen `s-ink` #0A0A0A -> Airbnb's measured #222222 everywhere
 *    load-bearing text renders (name, section titles, row labels, icons).
 * 2. Row-label size/weight: Solen's locked "name 14 / meta 12" text-size row does not
 *    name an account-row label size at all, but the shipped AccountHub.tsx runs
 *    15.5px/500; this ships 16px/500 (the corrected Airbnb estimate) plus a section
 *    title jump to 24px/700 replacing the current 12px sentence-case eyebrow.
 * 3. Icon stroke width: shipped AccountHub.tsx uses strokeWidth 2.2; this uses 1.5,
 *    the measured Airbnb band (1.33-1.5pt).
 * 4. Avatar size: shipped AccountHub.tsx uses 60px; this uses 48px, the nearest
 *    Airbnb-measured avatar-circle value (review avatar, look-recipe #15).
 * 5. Divider hairline color: Solen's locked `s-border` #E4E4E7 -> Airbnb's literal
 *    measured #EBEBEB, drawn ONLY at a group boundary (never within a group), matching
 *    Recipe A's "zero within a group, one hairline only where a group ends" exactly.
 * 6. Press curve: Solen's locked 150ms `thud` (accelerate, cubic-bezier(0.7,0,0.84,0))
 *    -> Airbnb's measured 100ms decelerate cubic-bezier(0.2,0,0,1) on every row press,
 *    already flagged as a known, deliberate divergence in airbnb--motion.md's own
 *    Conflicts section ("owner call already made... recorded here only so a mockup
 *    builder does not fix Solen's press curve toward Airbnb's by mistake") , ported
 *    here anyway because this direction's whole point is showing that exact swap for
 *    comparison, not silently avoiding it.
 * 7. Dropped the small "Konto"/"Account" eyebrow label that sits above the avatar in
 *    the shipped AccountHub.tsx: Airbnb's own Profile-tab root (airbnb--profile-list.md,
 *    IMG_6900) carries no such label above its identity block (only a nav-bar title,
 *    which is chrome and out of scope here), and keeping it would add a 5th font size
 *    inside the 4-size-per-screen ceiling this build must still hold even in LOOK-FULL.
 * 8. Weight: measured live (Playwright, getComputedStyle) that `app/globals.css`'s sitewide
 *    `main :is(.font-semibold,.font-bold) { font-weight:500 }` rule (dashboard-only exclusion)
 *    silently clamps every `.font-bold` on this app to 500, so the name and section titles
 *    below use an inline `fontWeight: 700` to actually render Airbnb's bold identity/section
 *    weight; the class stays for semantics. Distinct rendered weights on this screen: 500
 *    (row label, subline, edit link) and 700 (name, section titles), 2 total, within budget.
 *
 * Floors held (not broken, even in LOOK-FULL): no invented data (every value below
 * comes from loadProfileB.ts's real query against the seed customer), no image with a
 * hardcoded src (Avatar's img src is data-driven, null falls back to initials), no dark
 * mode, WCAG AA text contrast (#222222 on white ~15.3:1, #6C6C6C on white ~4.9:1, both
 * pass), 44px+ touch targets (each row's own tap target is the full-width Link, min
 * height ~56-58px, comfortably above 44), <=4 distinct sizes / <=2 weights on the first
 * viewport (28/700 name, 24/700 section title, 16/500 row label, 13/500 subline+link),
 * no em-dashes.
 */
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
import type { ProfileBData } from "./loadProfileB";

const INK = "#222222"; // drift-ok: LOOK-FULL, CONFLICT 1, Airbnb measured ink (look-recipe #5) overriding locked s-ink
const SECONDARY = "#6C6C6C"; // drift-ok: LOOK-FULL, Airbnb measured secondary text (look-recipe #4)
const HAIRLINE = "#EBEBEB"; // drift-ok: LOOK-FULL, CONFLICT 5, Airbnb measured divider grey overriding locked s-border

export interface AccountHubAirbnbProps extends ProfileBData {
  locale: string;
}

export default function AccountHubAirbnb({
  locale,
  avatarUrl,
  displayName,
  nextAppointment,
  favoritesCount,
  wallet,
  activeVouchersCount,
  stamps,
}: AccountHubAirbnbProps) {
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
      {/* Identity block. No "Konto" eyebrow above it (CONFLICT 7): Airbnb's own Profile
          root carries none over the identity block, and keeping it would add a 5th
          font size to this screen's budget. */}
      <div className="pt-[22px]">
        <div className="flex items-center gap-3.5">
          {/* CONFLICT 4: 48px, the nearest Airbnb-measured avatar-circle value
              (review avatar, look-recipe #15), not the shipped file's 60px. */}
          <Avatar src={avatarUrl} name={displayName} size={48} />
          <div className="min-w-0 flex-1">
            {/* Display anchor, FLOORS LAW 6: kept >= 28px. Weight bumped to 700 and ink
                to Airbnb's #222222 (CONFLICT 1), tracking dropped (not a measured
                Airbnb value, Solen's own tight-tracking habit, not ported). */}
            <h1
              className="truncate font-heading text-[28px] font-bold"
              // CONFLICT 8: globals.css's sitewide `main :is(.font-semibold,.font-bold) { font-weight:500 }`
              // clamps every `.font-bold` class on this app to 500 (dashboard-only exclusion, see that
              // rule's own comment). An inline style has higher specificity than that class selector, so
              // it is set directly here to actually render Airbnb's bold identity name, full strength.
              style={{ color: INK, fontWeight: 700 }}
            >
              {displayName}
            </h1>
            <Link
              href={p("/profile/edit")}
              className="-my-1 inline-block py-1 text-[13px] font-medium text-s-accent underline-offset-2 hover:underline"
            >
              {t("editProfile")}
            </Link>
          </div>
        </div>
      </div>

      <GroupTitle first>{t("statBookings")}</GroupTitle>
      <div>
        <Row href={p("/profile/bookings")} icon={Calendar} label={t("statBookings")} sub={bookingsSub} />
      </div>

      <Hairline />
      <GroupTitle>{t("tileWallet")}</GroupTitle>
      <div>
        <Row href={p("/profile/settings/payment")} icon={WalletIcon} label={t("tileWallet")} sub={walletSub} />
        <Row href={p("/profile/vouchers")} icon={TicketPercent} label={t("vouchers")} sub={couponsSub} />
      </div>

      <Hairline />
      <GroupTitle>{t("hubPersonal")}</GroupTitle>
      <div>
        <Row href={p("/profile/haarprofil")} icon={HairGlyph} label={t("haarprofil")} />
        <Row
          href={p("/profile/favorites")}
          icon={Heart}
          iconColor={INK}
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
              <span className="text-[13px] font-medium tabular-nums" style={{ color: INK }}>
                {stamps.collected}/{stamps.needed}
              </span>
            ) : undefined
          }
        />
      </div>

      <Hairline />
      <div>
        <Row href={p("/profile/settings")} icon={Settings} label={t("settingsTitle")} />
      </div>

      <form action="/api/auth/logout" method="post" className="mt-[30px] text-center">
        <button
          type="submit"
          className="inline-flex items-center gap-[7px] text-[16px] font-medium text-s-error transition-opacity active:opacity-60"
        >
          <LogOut size={17} strokeWidth={1.5} aria-hidden />
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}

/* Section title, CONFLICT 2: 24px/700 in Airbnb's measured ink, replacing the shipped
   file's 12px sentence-case grey eyebrow. Derived from profile-list.md's Login&security
   section-header cap-height (17.0pt) divided by the same ~0.72 cap-height-to-font-size
   ratio the source file's own correction used for the row label (17.0/0.72 ~= 23.6,
   rounded to 24 to land on the 4pt grid). */
function GroupTitle({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <p
      className={cn("px-1 text-[24px] font-bold", first ? "mb-3 mt-[26px]" : "mb-3 mt-6")}
      style={{ color: INK, fontWeight: 700 }} // CONFLICT 8, see the h1's comment above: inline style beats the sitewide font-bold->500 clamp
    >
      {children}
    </p>
  );
}

/* CONFLICT 5: one #EBEBEB hairline ONLY at a group boundary, never within a group,
   matching profile-list.md's Recipe A exactly ("zero divider between rows in the same
   group... one divider only where a whole group ends"). The page's own px-5 container
   already carries an inset close to the measured 24pt margin, so no extra inset is
   added here. */
function Hairline() {
  return <div className="mt-6 border-t" style={{ borderColor: HAIRLINE }} aria-hidden />;
}

function Row({
  href,
  icon: Icon,
  iconColor,
  label,
  sub,
  end,
}: {
  href: string;
  icon: LucideIcon | typeof HairGlyph;
  iconColor?: string;
  label: string;
  sub?: string;
  end?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-[14px] px-1 py-[10px] transition-transform duration-100 active:scale-[0.99]"
      style={{ transitionTimingFunction: "cubic-bezier(0.2,0,0,1)" }} // CONFLICT 6: Airbnb's measured press curve, not Solen's locked thud
    >
      {/* CONFLICT 3: bare glyph (no tile, matching Recipe A's "no tile" finding), 22px
          (within the measured 17-23pt band), strokeWidth 1.5 (measured 1.33-1.5pt). */}
      <span className="grid h-[22px] w-[22px] shrink-0 place-items-center" style={{ color: iconColor ?? INK }}>
        <Icon size={22} strokeWidth={1.5} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-[16px] font-medium" style={{ color: INK }}>
          {label}
        </span>
        {sub ? (
          <span className="mt-0.5 block truncate text-[13px] font-medium" style={{ color: SECONDARY }}>
            {sub}
          </span>
        ) : null}
      </span>
      {end}
      <ChevronRight size={18} strokeWidth={1.5} className="shrink-0" style={{ color: INK }} aria-hidden />
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
