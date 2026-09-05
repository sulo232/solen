// Grounded-in: app/[locale]/_components/profile/AccountHub.tsx
// exists-check: extends the file above (the identity header block below is the same
// anatomy as that file's own header, read in full this turn; the Row/icon primitives here
// are new local copies because AccountHub's `Row` is not exported and this direction's row
// anatomy genuinely differs, per the task's "copy into your own folder, then change the
// copy" rule).
//
// Direction: Fresha directory. Axis: STRUCTURE (Fresha's flat, ungrouped destination list)
// over Solen's own look/locks (kept, see Conflicts). Identity block unchanged from the
// live hub; the ONLY thing this direction varies is the row list below it: one flat list,
// no group eyebrows, no sublines, no counts, each a bare noun + icon + chevron, in the
// order the brief specified (Bookings, Saved, Vouchers, Wallet/Cards, Hair profile,
// Stamps, Settings), then a whitespace gap, then Language + Support as two inline text
// links (no chevron), then Sign out.
//
// Sources:
//   - Structure: _design-system/references/fresha--profile.md ("Measured" list: one flat
//     list of eight rows, icon+label+chevron, zero divider within the list, "Below the
//     list, separated by a visible gap (not a hairline), two inline items... in the
//     accent purple/blue used for links... these read as TEXT LINKS, not list rows with
//     chevrons"). Row order/labels adapted to Solen's real 7 destinations per the brief
//     (Fresha's own set does not map 1:1; two of Fresha's rows have no Solen analog, see
//     fresha--profile.md's own Port map + Conflicts sections).
//   - Look/tokens: kept from the live app/[locale]/_components/profile/AccountHub.tsx
//     (bare 22px ink icon, no tile; 15.5px/500 row label; ChevronRight 18/1.9; blue
//     s-accent text links; 28px/600 name anchor), none of which this direction touches.
//   - Icons: Lucide only, matching AccountHub.tsx's existing choices per destination
//     (Calendar, Heart, TicketPercent, Wallet, Stamp, Settings, ChevronRight, LogOut) plus
//     Globe/LifeBuoy for the two new escape links (not in the live hub, see Conflicts).
//
// Depicts: identity block (avatar, name, edit link) -> AccountHub.tsx lines ~141-168,
//   unchanged anatomy, real seed data via ./getProfileIdentityA.ts.
// Depicts: Bookings row -> app/[locale]/profile/bookings/page.tsx (real route).
// Depicts: Saved row -> app/[locale]/profile/favorites/page.tsx (real route).
// Depicts: Vouchers row -> app/[locale]/profile/vouchers/page.tsx (real route).
// Depicts: Wallet row -> app/[locale]/profile/settings/payment (real route, confirmed a
//   real dir on disk this turn).
// Depicts: Hair profile row -> app/[locale]/profile/haarprofil/page.tsx (real route).
// Depicts: Stamps row -> app/[locale]/profile/stamps/page.tsx (real route).
// Depicts: Settings row -> app/[locale]/profile/settings/page.tsx (real route).
// Depicts: Language link -> app/[locale]/profile/settings/language (real route, confirmed
//   a real dir on disk this turn; NOT on the live hub today, added per this direction's
//   Fresha structure, see Conflicts).
// Depicts: Support link -> app/[locale]/help/page.tsx (real route, found via
//   app/[locale]/_components/layout/Footer.tsx's own `{ labelKey: "customerHelp", href:
//   "/help" }` reference and confirmed a real page.tsx on disk this turn; NOT on the live
//   hub today, added per this direction's Fresha structure, see Conflicts).
// Depicts: Sign out -> the same `/api/auth/logout` form POST AccountHub.tsx already uses.
//
// Conflicts (Solen locks kept, listed per the brief):
//   - Fresha's flat ungrouped list vs Solen's dated grouped-row model (owner 2026-08-02,
//     "konto hub better", fresha--profile.md's own CONFLICT entry). This direction shows
//     the flat version for the owner's side-by-side call; it does not silently replace
//     the grouped model.
//   - Fresha shows no sublines/counts on any row; Solen's live hub deliberately shows
//     real ones (next-appointment date, saved-card brand, active voucher/stamp counts),
//     its own no-fabrication-forward pattern. This direction drops them ALL per the
//     brief's literal ask ("no sublines or counts"), which is a real loss of information
//     against the live hub, flagged here rather than smoothed over.
//   - Language and Support are NOT rows on the live hub today (FIXED normally reads "no
//     row added"), but the brief's Direction A spec explicitly calls for them as Fresha's
//     two escape links. Both point at real, already-existing routes
//     (/profile/settings/language, /help), never a fabricated destination.
//   - Fresha's own gift-voucher-purchase row is not ported: the owner hid that feature
//     from customers on 2026-06-14 (graveyard hit, fresha--profile.md's own CONFLICT
//     entry). Not re-added.
//
// floors: photo focal = none (this screen carries no photography in the live hub either,
//   exempt per the design contract's "forms/settings-like surfaces" pattern, an account
//   directory has no salon/photo content to show); one biggest element = the 28px name;
//   a real number = none rendered by design (Direction A's whole point is dropping counts,
//   see Conflicts above; the identity block itself carries no number either on the live
//   hub); a semantic-colour moment = the blue s-accent Language/Support links + Edit
//   profile link; no dead grey zone = white background throughout, ink icons, no grey
//   fill blocks; worst-case content = displayName truncates (`truncate` class, matches
//   AccountHub.tsx), every row label is a short fixed noun (no salon/service name ever
//   renders in this list), so there is no unbounded-length string on this screen.
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
  Globe,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import type { ProfileIdentityA } from "./getProfileIdentityA";

export default function ProfileDirectionA({
  locale,
  identity,
}: {
  locale: string;
  identity: ProfileIdentityA;
}) {
  const t = useTranslations("profileHub");
  const p = (path: string) => `/${locale}${path}`;

  return (
    <div className="mx-auto max-w-[560px] px-5 pb-16">
      {/* Identity block: unchanged anatomy from the live hub (not part of this
          direction's axis). Name is the screen's one >=28px display anchor. */}
      <div className="pt-[18px]">
        <p className="mb-3.5 text-[12px] font-semibold text-s-ink-2">{t("hubSectionAccount")}</p>
        <div className="flex items-center gap-3.5">
          <Avatar src={identity.avatarUrl} name={identity.displayName} size={60} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
              {identity.displayName}
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

      {/* THE VARY AXIS: one flat list, no group eyebrows, no sublines, no counts. */}
      <div className="mt-[22px] bg-white">
        <Row href={p("/profile/bookings")} icon={Calendar} label={t("statBookings")} />
        <Row href={p("/profile/favorites")} icon={Heart} iconClassName="text-s-ink" label={t("tabSaved")} />
        <Row href={p("/profile/vouchers")} icon={TicketPercent} label={t("vouchers")} />
        <Row href={p("/profile/settings/payment")} icon={WalletIcon} label={t("tileWallet")} />
        <Row href={p("/profile/haarprofil")} icon={HairGlyph} label={t("haarprofil")} />
        <Row href={p("/profile/stamps")} icon={Stamp} label={t("tileStamps")} />
        <Row href={p("/profile/settings")} icon={Settings} label={t("settingsTitle")} />
      </div>

      {/* Escape hatches: Fresha's own anatomy (fresha--profile.md item 4), a visible gap
          (not a hairline), two bare inline text links, no chevron. Not on the live hub
          today (see Conflicts). */}
      <div className="mt-[30px] flex items-center gap-6 px-1">
        {/* -my-2 py-2 grows the hit box the same way AccountHub.tsx's own "Edit profile"
            link does (17px measured -> 25px), clearing WCAG 2.5.8 Target Size AA (24px)
            with no visible layout change. */}
        <Link href={p("/profile/settings/language")} className="-my-2 inline-flex items-center gap-1.5 py-2 text-[14px] font-medium text-s-accent">
          <Globe size={16} strokeWidth={1.9} aria-hidden />
          {t("hubLanguage")}
        </Link>
        <Link href={p("/help")} className="-my-2 inline-flex items-center gap-1.5 py-2 text-[14px] font-medium text-s-accent">
          <LifeBuoy size={16} strokeWidth={1.9} aria-hidden />
          {t("hubSectionSupport")}
        </Link>
      </div>

      <form action="/api/auth/logout" method="post" className="mt-[30px] text-center">
        <button
          type="submit"
          className="inline-flex items-center gap-[7px] text-[15.5px] font-medium text-s-error transition-opacity active:opacity-60" /* type-scale-ok: verbatim from the shipped AccountHub.tsx sign-out button (its own comment: "consolidated to the row-label size"), not a new value */
        >
          <LogOut size={17} strokeWidth={1.9} aria-hidden />
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}

function Row({
  href,
  icon: Icon,
  iconClassName,
  label,
}: {
  href: string;
  icon: LucideIcon | typeof HairGlyph;
  iconClassName?: string;
  label: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-[14px] px-1 py-[15px] transition-transform duration-150 active:scale-[0.99]">
      <span className="grid h-[22px] w-[22px] shrink-0 place-items-center text-s-ink">
        <Icon size={22} strokeWidth={2.2} className={iconClassName} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate font-heading text-[15.5px] font-medium tracking-[-0.01em] text-s-ink"> {/* type-scale-ok: verbatim from the shipped AccountHub.tsx row label, not a new value */}
        {label}
      </span>
      <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink" aria-hidden />
    </Link>
  );
}

// Verbatim copy of AccountHub.tsx's own HairGlyph helper (not exported from that file, so
// copied rather than imported, per the task's own rule). Same real asset, same mask
// technique, same default size.
function HairGlyph({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={className ? `inline-block shrink-0 bg-current ${className}` : "inline-block shrink-0 bg-current"}
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
