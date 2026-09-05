"use client";

// Exists-check: `npm run exists profile` and `npm run exists AccountHub` ran this turn
// (AccountHub.tsx is the real, live account hub; see this file's own header for what it
// carries). `npm run exists directions-0905` ran this turn too, surfacing every sibling
// direction file that already exists under this same tree, none of which builds a
// next-appointment hero for /profile.
//
// Direction: NEXT-UP HERO, WITH MOTION (this surface's `?v=c`). One idea only (VARY
// axis): the customer's real next appointment leads the hub as a full-width hero card,
// entering with THE ENTER RECIPE on mount; everything below it (identity block, the
// Buchungen/Wallet/Personal groups, their sublines, Settings, Abmelden) is the SAME
// content and anatomy as the live `/profile` hub today, unchanged, per the brief
// ("the live groups and rows exactly as today with their sublines"). LOCK MODE: Solen
// locks KEPT (not the LOOK-FULL direction of this set), so every value below is a
// SOLEN token, never an Airbnb literal ported at full strength; every place an Airbnb
// number was considered and NOT applied is named in Conflicts below.
//
// This file is a COPY of `app/[locale]/_components/profile/AccountHub.tsx` (325 lines,
// read in full before writing this), not an import, because the brief's one change
// (insert a hero between the identity block and the first group) requires inserting
// JSX in the middle of that component's render, which the off-limits rule's own escape
// hatch names as the legitimate reason to copy rather than import ("If your direction
// needs a component's anatomy or look changed, COPY that component into your own
// folder, rename it, and change the copy"). Every row/group/label/icon/subline below
// this file's own HERO section is byte-identical to that source, including its own
// inline comments (kept so the provenance of each anatomy decision, e.g. why the name
// is 28px not the mockup's 24px, why row-label weight is 500 not 600, travels with the
// copy). The two real changes: (1) the HERO section inserted after the identity block,
// (2) `Row`'s press feedback, described in Conflicts.
//
// Depicts: identity block, GroupLabel, RowCard, Row, HairGlyph -> byte-identical copy of
//   `app/[locale]/_components/profile/AccountHub.tsx` (325 lines, read in full).
// Depicts: hero card anatomy (photo left/date-block/service+stylist/Manage link) ->
//   `components-legacy/booking/BookingCard.tsx`'s own focal date block (the `dow/day/mon`
//   sunken 12px-radius block) and photo-fallback pattern -> `components-legacy/
//   SalonCard.tsx` (the `aspect-[5/4]` `<Image>` + sunken-bg/category-icon/initial
//   fallback for a missing cover photo, `_design-system/LOCKFILE.md`'s imagery-fallback
//   spec, never a bare grey box).
// Depicts: entrance timing (280ms, opacity+scale 0.96->1+blur(8px->0), `glide` ease) ->
//   `app/[locale]/_components/primitives/motion.ts`'s `useEnterMotion` (THE ENTER
//   RECIPE, `_design-system/MOTION.md`, imported here, never hand-rolled).
// Depicts: row press feedback -> `_design-system/LOCKFILE.md` §4's `thud` easing token
//   + the SOURCE §6 3-tier press convention ("row 0.98"), NOT
//   `_design-system/references/airbnb--motion.md`'s measured 100ms-decelerate press
//   value, see Conflicts for why.
//
// Sources: `_design-system/references/fresha--profile.md` (structure: this direction
// keeps Solen's grouped-row model over Fresha's flat directory, per that file's own
// "CONFLICT [flat list vs. grouped rows]" entry and the brief's fixed instruction that
// groups stay for directions b/c), `_design-system/references/airbnb--profile-list.md`
// (Recipe A's bare, untiled icon + zero within-group divider anatomy, already the shape
// `AccountHub.tsx`'s own `Row`/`RowCard` carry, so no change was needed here to match
// it), `_design-system/references/airbnb--look-recipe.md` (considered the 20px card
// radius / shadow-free card recipe for the hero; NOT applied, see Conflicts),
// `_design-system/references/airbnb--motion.md` (considered the 100ms decelerate press
// curve; NOT applied, see Conflicts; the 280ms/glide/blur ENTER RECIPE for the hero IS
// applied, but that recipe is Solen's own locked value, not a Airbnb port, per that
// file's own "Does the ENTER RECIPE hold?" section).
//
// Conflicts (locks kept, listed per LOCK MODE):
// - Grouped rows kept over Fresha's flat directory (fresha--profile.md's own named
//   conflict; owner decides between directions a/b/c on his phone, not this file).
// - Hero card radius stays Solen's locked `rounded-card` (16px) + `shadow-whisper` +
//   the Edge-visibility floor's flush-photo-edge option, NOT Airbnb's measured 20px
//   card radius / zero-shadow recipe (`airbnb--look-recipe.md` CONFLICT [card
//   elevation] and CONFLICT [radius family]). This direction is not the LOOK-FULL one.
// - Row press timing stays Solen's locked `thud` (`cubic-bezier(0.7,0,0.84,0)`,
//   accelerate, "press-down feel") at 150ms and the row-tier 0.98 scale, NOT Airbnb's
//   measured 100ms `cubic-bezier(0.2,0,0,1)` decelerate press
//   (`airbnb--motion.md`'s own CONFLICT [motion]: press-feedback curve names this exact
//   collision and says plainly: "recorded here only so a mockup builder does not 'fix'
//   Solen's press curve toward Airbnb's by mistake." Followed literally.). Rows add a
//   `bg-s-bg-sunken` press fill (a Solen-token background feedback, not previously on
//   this row) alongside the existing scale, both on the SAME locked 150ms/thud timing.
// - Ink stays Solen's frozen `#0A0A0A` (`s-ink`), not Airbnb's measured `#222222`
//   (`airbnb--look-recipe.md` CONFLICT [ink hardness]).
//
// Floors (customer screen, all six): (a) photographic focal = the hero's salon photo;
// (b) the ONE clearly-biggest element = the hero card's overall footprint (photo + date
// block + two text lines), visibly larger than any single group row, even though the
// date-block digit itself reuses the identity name's own 28px anchor rather than adding
// a bigger, budget-costing size (see the type-budget note at the Row-block below);
// (c) tabular real number = the hero's price (`tabular-nums`, real seeded CHF value) and
// the date-block day; (d) semantic-colour moment = the existing sign-out link's
// `text-s-error` red (unchanged from the live hub, this screen's one semantic moment;
// the hero deliberately carries no extra colored badge of its own, since one would
// duplicate the hero's own unambiguous framing without adding real information); the
// existing Stamps row's tabular
// count and the sign-out red text already carry the screen's only semantic ink outside
// the hero, same as the live hub); (e) no dead-grey zone = the hero sits on a photo +
// sunken date-block, the groups sit on white with hairline group boundaries, alternating
// per the live hub's own rhythm; (f) worst-case content holds = `truncate` on salon
// name/service/staff line (same discipline as `Row`'s own `truncate` label/sub), long
// service names wrap only in the tabular date/price cells, never breaking the two-ink-
// anchor rule (name larger than price, both ink, same as `Row`).

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
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
  MapPin,
  Scissors,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { useEnterMotion } from "@/app/[locale]/_components/primitives/motion";
import { formatCurrency } from "@/lib/format-currency";
import type { ProfileCData } from "./getProfileC";

// Same fallback tint as SalonCard.tsx's own BLUR_PLACEHOLDER (a 1px sunken-neutral SVG,
// not a new color).
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOCA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4=";

export interface AccountHubDirectionCProps {
  locale: string;
  data: ProfileCData;
}

export default function AccountHubDirectionC({ locale, data }: AccountHubDirectionCProps) {
  const t = useTranslations("profileHub");
  const tProfile = useTranslations("Profile");
  const p = (path: string) => `/${locale}${path}`;

  const { displayName, avatarUrl, nextAppointment, favoritesCount, wallet, activeVouchersCount, stamps } = data;

  const bookingsSub = nextAppointment
    ? t("nextAppointmentOn", {
        date: formatDate(nextAppointment.startsAt, locale),
        time: formatTime(nextAppointment.startsAt, locale),
      })
    : t("bookingsRowEmptySub");

  // wallet === null: the Stripe payment-methods call was intentionally skipped this
  // pass (see getProfileC.ts header). Omit the subline rather than assert a possibly-
  // false "no card saved" or a specific count, same withhold-on-unknown pattern the
  // live hub already uses for a genuine favoritesCount/activeVouchersCount query
  // failure.
  const walletSub = wallet === null ? undefined : t("walletRowEmptySub");

  const couponsSub =
    activeVouchersCount === null
      ? undefined
      : activeVouchersCount > 0
        ? t("couponsRowActive", { count: activeVouchersCount })
        : t("couponsRowEmptySub");

  const stampsSub = stamps ? t("stampsRowActive", { remaining: stamps.needed - stamps.collected }) : t("stampsRowEmptySub");

  return (
    <div className="mx-auto max-w-[560px] px-5 pb-16">
      {/* Header: eyebrow + avatar + name. Byte-identical to AccountHub.tsx. */}
      <div className="pt-[18px]">
        <p className="mb-3.5 text-[12px] font-semibold text-s-ink-2">{t("hubSectionAccount")}</p>
        <div className="flex items-center gap-3.5">
          <Avatar src={avatarUrl} name={displayName} size={60} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
              {displayName}
            </h1>
            <Link
              href={p("/profile/edit")}
              className="-my-1 inline-block py-1 text-[14px] font-medium text-s-accent underline-offset-2 hover:underline"
            >
              {t("editProfile")}
            </Link>
          </div>
        </div>
      </div>

      {/* HERO: the one idea of this direction. Real seeded booking only; renders the
          locked EmptyState primitive instead when there is none (never fabricated). */}
      <div className="mt-5">
        {nextAppointment ? (
          <HeroAppointment appointment={nextAppointment} locale={locale} manageLabel={t("viewDetails")} manageHref={p("/profile/bookings")} />
        ) : (
          <EmptyNextAppointment browseHref={p("/")} />
        )}
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

      {/* PERSÖNLICH: hair profile, saved stores, loyalty stamps. */}
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
          end={stamps ? <span className="text-[13px] font-medium tabular-nums text-s-ink">{stamps.collected}/{stamps.needed}</span> : undefined}
        />
      </RowCard>

      {/* EINSTELLUNGEN */}
      <RowCard className="mt-[26px]">
        <Row href={p("/profile/settings")} icon={Settings} label={t("settingsTitle")} />
      </RowCard>

      {/* ABMELDEN */}
      <form action="/api/auth/logout" method="post" className="mt-[30px] text-center">
        <button
          type="submit"
          className="inline-flex items-center gap-[7px] text-[15.5px] font-medium text-s-error transition-opacity active:opacity-60"
        >
          <LogOut size={17} strokeWidth={1.9} aria-hidden />
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}

function formatDate(iso: string, locale: string) {
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  return new Date(iso).toLocaleDateString(localeCode, { weekday: "short", day: "numeric", month: "long", timeZone: "Europe/Zurich" });
}
function formatTime(iso: string, locale: string) {
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  return new Date(iso).toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Zurich" });
}

/**
 * The hero: full-width card, salon photo left, a focal date block (the screen's
 * >=28px display anchor family, LOCKFILE FLOORS LAW 6), service + stylist line, a
 * "View details" link to the real bookings route. Enters with THE ENTER RECIPE on
 * mount (`useEnterMotion`, imported, never hand-rolled). Radius/shadow/ink stay Solen
 * locks (`rounded-card` 16px, `shadow-whisper`, `s-ink`), see file header Conflicts
 * for the Airbnb values considered and not applied.
 */
function HeroAppointment({
  appointment,
  locale,
  manageLabel,
  manageHref,
}: {
  appointment: NonNullable<ProfileCData["nextAppointment"]>;
  locale: string;
  manageLabel: string;
  manageHref: string;
}) {
  const enter = useEnterMotion();
  const startDate = new Date(appointment.startsAt);
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const dow = startDate.toLocaleDateString(localeCode, { weekday: "short", timeZone: "Europe/Zurich" });
  const day = startDate.toLocaleDateString(localeCode, { day: "2-digit", timeZone: "Europe/Zurich" });
  const mon = startDate.toLocaleDateString(localeCode, { month: "short", timeZone: "Europe/Zurich" });
  const time = startDate.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Zurich" });

  const priceLabel = appointment.price != null ? formatCurrency(appointment.price, localeCode) : null;
  const stylistLine = [appointment.serviceName, appointment.staffName].filter(Boolean).join(" · ");

  const inner = (
    <div className="rounded-card border border-s-border bg-white p-3 shadow-whisper">
      <div className="flex items-start gap-3">
        {/* Photo: real seeded salon cover, or the LOCKFILE fallback (sunken + category
            icon + initial), never a bare grey box. */}
        <div className="relative h-[68px] w-[68px] flex-none overflow-hidden rounded-[12px]">
          {appointment.salonCoverUrl ? (
            <Image
              src={appointment.salonCoverUrl}
              alt={appointment.salonName}
              fill
              sizes="68px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-s-bg-sunken">
              <Scissors className="h-6 w-6 text-s-ink-2" strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>

        {/* Focal date block, the screen's second display anchor: day reuses the SAME
            28px the identity name above already carries (>=28px floor, >=1.8x the
            15.5px row-label body), a deliberate size-budget consolidation, not a
            missed distinct value: a genuinely new 34px would push this screen to 6
            distinct sizes past the identity block's own pre-existing 12/13/14/15.5/28,
            when 28 already satisfies the same floor. Dow/mon reuse the existing 12px
            eyebrow size instead of a new 11px. See header Conflicts. */}
        <div className="flex-none w-[56px] rounded-[12px] bg-s-bg-sunken py-2 text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-s-ink-2">{dow}</div>
          <div className="font-heading text-[28px] font-bold leading-[1.0] text-s-ink tabular-nums">{day}</div>
          <div className="text-[12px] text-s-ink-2">{mon}</div>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">
            {appointment.salonName}
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-s-ink-2">{stylistLine}</p>
          {appointment.salonAddress && (
            <p className="mt-1 flex items-center gap-1 text-[12px] text-s-ink-2">
              <MapPin size={12} className="flex-none" aria-hidden />
              <span className="truncate">{appointment.salonAddress}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-s-border pt-3">
        <div className="text-[13px] text-s-ink-2">
          {time}
          {priceLabel ? <span className="ml-2 font-medium tabular-nums text-s-ink">{priceLabel}</span> : null}
        </div>
        <Link href={manageHref} className="text-[14px] font-medium text-s-accent underline-offset-2 hover:underline">
          {manageLabel}
        </Link>
      </div>
    </div>
  );

  return (
    <motion.div initial={enter.initial} animate={enter.animate} transition={enter.transition}>
      {inner}
    </motion.div>
  );
}

/** No upcoming booking: the locked `<EmptyState>` anatomy (icon + message + CTA, one
 * vertically-centred unit, NEVER-AGAIN floor 3), never a bespoke redraw. Not reached by
 * the seed customer today (two upcoming bookings exist), kept so the component is
 * correct if that ever changes. */
function EmptyNextAppointment({ browseHref }: { browseHref: string }) {
  const t = useTranslations("profileHub");
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-s-bg-sunken px-6 py-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-white">
        <Calendar className="h-6 w-6 text-s-ink" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="font-heading text-[16px] font-semibold text-s-ink">{t("tabAppointmentsEmpty")}</p>
      <p className="text-[13px] text-s-ink-2">{t("tabAppointmentsEmptyLead")}</p>
      <Link
        href={browseHref}
        className="mt-1 inline-flex h-11 items-center justify-center rounded-[16px] bg-s-ink px-5 text-[14px] font-semibold text-white"
      >
        {t("emptyStateCta")}
      </Link>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-[26px] px-1 text-[12px] font-semibold text-s-ink-2">{children}</p>;
}

function RowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white", className)}>{children}</div>;
}

/**
 * Row: byte-identical anatomy to AccountHub.tsx's own Row, with ONE addition: a press
 * state (background + scale) on Solen's own locked `thud` 150ms timing (row tier
 * 0.98), see file-header Conflicts for why this is 150ms/thud/0.98 and not Airbnb's
 * measured 100ms/decelerate/no-background press.
 */
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
    <Link
      href={href}
      className="flex items-center gap-[14px] rounded-[12px] px-4 py-[15px] transition-[transform,background-color] duration-150 ease-thud active:scale-[0.98] active:bg-s-bg-sunken"
    >
      <span className="grid h-[22px] w-[22px] shrink-0 place-items-center text-s-ink">
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
