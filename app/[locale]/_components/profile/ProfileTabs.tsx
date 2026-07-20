"use client";

// exists-check: `npm run exists ProfileTabs` (0 matches) ran this turn. Net-new client
// component vs the closest matches surfaced by the exists-guard: extends/imports
// EmptyStateDiscovery.tsx (Looks tab's empty state), components-legacy/ui/EmptyState.tsx
// (Termine/Gespeichert empties + no-search-results), primitives/Avatar.tsx (tab-bar avatar),
// lib/format-currency.ts (hero price), all reused as-is below, not duplicated. lib/format.ts
// and lib/search-filter-pills.ts are unrelated (server-side dashboard/search-filter helpers,
// not a client-side tab-content text filter). The only net-new piece is the tab-bar,
// client search-filter and 2-col tile-grid UI itself, which has no prior component.
//
// mockup-ok: every measured value below (40px avatar, 3px active-tab underline, 46px
// search field, 560px page max-width, 16px tile/card radius, 22px tab gap, 44px icon
// buttons, 4/3 tile photo ratio) traces to the owner-approved D1 pane of
// public/_mockups/sweep-profile-pinterest/index.html (task brief names it explicitly).
// The hero block's own markup/values (52px date chip, 22px date number, etc.) are
// copied from the currently-shipped app/[locale]/profile/page.tsx hero section (already
// in production), except the day-of-week label drops `uppercase` and tracking (sentence
// case now, no-caps gate): the one deliberate deviation from the 1:1 hero port.
//
// ProfileTabs: client half of the /profile "D1 Pinterest profile" rebuild (owner-approved
// public/_mockups/sweep-profile-pinterest/index.html, D1 pane, 2026-07-20/21). Owns tab
// state (Gespeichert / Termine / Looks), the client-side search filter, and the 2-col tile
// grid. The server page (app/[locale]/profile/page.tsx) does the auth guard and ALL data
// fetching (next-booking hero, past bookings, saved salons, the empty-state rail) and
// passes it down as plain props, this component renders it, translates it, and filters
// it. No client-side fetch anywhere, so there is no loading skeleton state (see
// ProfileTabs.md "States").

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Settings, Search, Scissors, ChevronRight, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import EmptyState from "@/components-legacy/ui/EmptyState";
import EmptyStateDiscovery, { type EmptyRailSalon } from "@/app/[locale]/_components/profile/EmptyStateDiscovery";

export interface ProfileHeroData {
  dow: string;
  day: string;
  mon: string;
  time: string;
  salonName: string;
  serviceName: string;
  durationMinutes: number | null;
  address: string | null;
  price: number | null;
}

export interface ProfilePastBookingTile {
  id: string;
  salonName: string;
  salonPhoto: string | null;
  serviceName: string;
  /** Pre-formatted "TT.MM.", no times on cards (project rule). */
  dateLabel: string;
}

export interface ProfileSavedSalonTile {
  slug: string;
  name: string;
  photo: string | null;
}

type ProfileTab = "saved" | "appointments" | "looks";

export interface ProfileTabsProps {
  locale: string;
  avatarUrl: string | null;
  displayName: string;
  /** The single upcoming confirmed booking, already server-formatted (Europe/Zurich). Null when none. */
  hero: ProfileHeroData | null;
  pastBookings: ProfilePastBookingTile[];
  savedSalons: ProfileSavedSalonTile[];
  /** Real top-rated salons for the Looks tab's EmptyStateDiscovery rail (never fabricated). */
  emptyRailSalons: EmptyRailSalon[];
}

export default function ProfileTabs({
  locale,
  avatarUrl,
  displayName,
  hero,
  pastBookings,
  savedSalons,
  emptyRailSalons,
}: ProfileTabsProps) {
  const t = useTranslations("profileHub");
  const tb = useTranslations("bookingCard");
  const [tab, setTab] = React.useState<ProfileTab>("appointments");
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const filteredBookings = q
    ? pastBookings.filter(
        (b) => b.salonName.toLowerCase().includes(q) || b.serviceName.toLowerCase().includes(q),
      )
    : pastBookings;
  const filteredSalons = q ? savedSalons.filter((s) => s.name.toLowerCase().includes(q)) : savedSalons;

  const p = (path: string) => `/${locale}${path}`;
  // drift-ok: em-space separator between service name and duration, not a middle-dot
  // glyph (A20/LOCKFILE §2.5 A12), the gate's own suggested fix.
  const serviceLine =
    hero != null
      ? hero.serviceName + (hero.durationMinutes ? ` ${hero.durationMinutes} ${tb("minutes")}` : "")
      : "";

  return (
    <div className="max-w-[560px] mx-auto px-4 pt-4 pb-16">
      {/* Tab bar: avatar (identity, not a link) plus centered tabs plus gear. The bell
          lives once, globally, in the Header (with its own unread badge), so this row's
          right side is settings only, no second bell here. */}
      <div className="flex items-center gap-2">
        <Avatar src={avatarUrl} name={displayName} size={40} />
        <div className="flex flex-1 items-center justify-center gap-[22px]">
          <TabButton active={tab === "saved"} onClick={() => setTab("saved")}>
            {t("tabSaved")}
          </TabButton>
          <TabButton active={tab === "appointments"} onClick={() => setTab("appointments")}>
            {t("tileAppointments")}
          </TabButton>
          <TabButton active={tab === "looks"} onClick={() => setTab("looks")}>
            {t("looks")}
          </TabButton>
        </div>
        <Link
          href={p("/profile/settings")}
          aria-label={t("settingsTitle")}
          className="grid h-11 w-11 shrink-0 place-items-center text-s-ink"
        >
          <Settings size={22} strokeWidth={1.9} aria-hidden />
        </Link>
      </div>

      {/* Search: real client-side filter over the active tab's items */}
      <label className="mt-3 flex h-[46px] items-center gap-2.5 rounded-card border border-s-border px-4">
        <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-3" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-s-ink outline-none placeholder:text-s-ink-3"
        />
      </label>

      {/* Live next-booking hero: the page's existing hero, promoted on top of the grid */}
      {hero ? (
        <section className="mt-4">
          <p className="mb-2.5 px-0.5 text-[13px] font-medium text-s-ink-2">{t("nextAppointment")}</p>
          <Link
            href={p("/profile/bookings")}
            className="block rounded-card border border-s-border bg-white p-4 shadow-elevation-1 transition-[transform,box-shadow] duration-200 ease-glide hover:-translate-y-[2px] hover:shadow-elevation-2 active:scale-[0.98]"
          >
            <div className="flex items-start gap-3">
              <div className="w-[52px] flex-none rounded-[12px] bg-s-bg-sunken py-2 text-center">
                <div className="text-[12px] font-semibold text-s-ink-2">{hero.dow}</div>
                <div className="font-heading text-[22px] font-bold leading-[1.05] text-s-ink">{hero.day}</div>
                <div className="text-[12px] text-s-ink-2">{hero.mon}</div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">
                  {hero.salonName}
                </h3>
                <p className="mt-0.5 truncate text-[14px] text-s-ink">{serviceLine}</p>
                {hero.address ? (
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-s-ink-2">
                    <MapPin size={13} className="flex-none text-s-ink-3" aria-hidden />
                    <span className="truncate">{hero.address}</span>
                  </p>
                ) : null}
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-s-ink-2">
                  <Clock size={13} className="flex-none text-s-ink-3" aria-hidden />
                  {hero.time}
                </p>
              </div>
              <div className="flex-none rounded-pill bg-s-success/10 px-2.5 py-1 text-[12px] font-semibold text-s-success">
                {tb("status.confirmed")}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-s-border pt-3">
              <div className="text-[15px] font-semibold text-s-ink">
                {hero.price != null ? (
                  <>
                    <span className="mr-1.5 text-[12px] font-normal text-s-ink-2">{tb("total")}</span>
                    {formatCurrency(hero.price)}
                  </>
                ) : null}
              </div>
              <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-s-ink">
                {t("viewDetails")}
                <ChevronRight size={16} strokeWidth={2.4} aria-hidden />
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      {/* Tab content: 2-col tile grid, or the locked empty-state pattern */}
      <div className="mt-4">
        {tab === "appointments" &&
          (filteredBookings.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {filteredBookings.map((b) => (
                <div key={b.id} className="min-w-0">
                  <SalonPhotoTile photo={b.salonPhoto} />
                  <p className="mt-2 truncate text-[14px] font-semibold text-s-ink">{b.salonName}</p>
                  {b.serviceName ? (
                    <p className="mt-0.5 truncate text-[12px] text-s-ink-2">{b.serviceName}</p>
                  ) : null}
                  <p className="mt-px truncate text-[12px] text-s-ink-3">{b.dateLabel}</p>
                </div>
              ))}
            </div>
          ) : pastBookings.length === 0 ? (
            <EmptyState icon={Scissors} title={t("tabAppointmentsEmpty")} message={t("tabAppointmentsEmptyLead")} />
          ) : (
            <EmptyState icon={Search} title={t("noSearchResults")} message={t("noSearchResultsLead")} />
          ))}

        {tab === "saved" &&
          (filteredSalons.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {filteredSalons.map((s) => (
                <Link key={s.slug} href={p(`/salon/${s.slug}`)} className="min-w-0">
                  <SalonPhotoTile photo={s.photo} />
                  <p className="mt-2 truncate text-[14px] font-semibold text-s-ink">{s.name}</p>
                </Link>
              ))}
            </div>
          ) : savedSalons.length === 0 ? (
            <EmptyState icon={Scissors} title={t("tabSavedEmpty")} message={t("tabSavedEmptyLead")} />
          ) : (
            <EmptyState icon={Search} title={t("noSearchResults")} message={t("noSearchResultsLead")} />
          ))}

        {tab === "looks" && (
          // The `looks` table and ingestion flow don't exist yet (verified via
          // `npm run exists`, LooksGrid is referenced but never built). This
          // mirrors /profile/looks/page.tsx's own always-empty FTU state 1:1,
          // just localized (the source page hardcodes German only).
          <EmptyStateDiscovery
            locale={locale}
            title={t("looksEmptyTitle")}
            lead={t("looksEmptyLead")}
            bannerImg={emptyRailSalons[0]?.cover_photo_url ?? null}
            bannerTitle={t("looksEmptyBannerTitle")}
            bannerSub={t("looksEmptyBannerSub")}
            bannerHref={p("/inspo")}
            hintIcon="bookmark"
            hintText={t("looksEmptyHint")}
            railTitle={t("emptyRailTitle")}
            railHref={p("/coiffeur")}
            salons={emptyRailSalons}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative shrink-0 py-3 font-body text-[15px] transition-colors",
        active ? "font-semibold text-s-ink" : "font-normal text-s-ink-2 hover:text-s-ink",
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-s-ink" aria-hidden /> : null}
    </button>
  );
}

function SalonPhotoTile({ photo }: { photo: string | null }) {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-card bg-s-bg-sunken">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL, matches EmptyStateDiscovery/FavoritesList convention
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <Scissors size={22} strokeWidth={1.9} className="text-s-ink-3" aria-hidden />
        </div>
      )}
    </div>
  );
}
