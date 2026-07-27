"use client";

// mockup-ok: every measured value below (48px avatar, 28px identity name, 24px gear
// glyph, 18px underline tabs with a 2px ink underline, 44px/radius-12 search, 44px
// Sortieren pill, aspect-[195/131] collage tiles with a 66/34 main+thumb split,
// aspect-[148/101] discovery cards, 56px/radius-12 rebook thumbs) traces to the
// owner-approved public/_mockups/pinterest-ref-solen/index.html (task brief names it
// explicitly as the complete spec, 2026-07-21). The empty-state tray anatomy (promise
// headline, gesture subline, filled ink pill CTA, sanctioned 3D category icon) traces to
// _design-system/research/TASTE_EMPTY_STATES.md (owner-demanded reference sweep,
// 2026-07-21), which supersedes the old grey-Lucide-disc <EmptyState> ritual for this
// surface.
//
// exists-check: `npm run exists ProfileTabs` ran this turn (this file). Reuses/extends
// Avatar.tsx (identity avatar), lib/format-currency.ts (booking price), the
// express-rebook POST + confirm pattern from components-legacy/booking/BookingsList.tsx
// (handleRebook), and the toast singleton (primitives/Toast.tsx). The only net-new UI is
// the two-tab bar, the client search/sort filter, the collage tile, and the promise-style
// empty tray, none of which had a prior component.
//
// OWNER CORRECTION 2026-07-21: the Looks tab is DROPPED (two tabs only: Gespeichert /
// Termine). There is no next-appointment hero on this page (owner killed it); the "Neu
// für dich" discovery row is the thing that keeps every tab (including both empty
// states) out of a dead-grey zone.
//
// ProfileTabs: client half of the /profile rebuild. Owns tab state, the client-side
// search filter, and the newest/alphabetical sort toggle. The server page
// (app/[locale]/profile/page.tsx) does the auth guard and ALL data fetching and passes
// it down as plain props; this component only renders, translates, filters and sorts.

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Settings, Search, Scissors, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

export interface ProfilePastBookingTile {
  id: string;
  salonId: string;
  serviceId: string;
  salonSlug: string | null;
  salonName: string;
  salonPhoto: string | null;
  /** imagery-icons-03 (2026-07-27): salon category label ("Coiffeur" etc), real
   *  structured metadata for the thumb's alt text, not just the name repeated. */
  salonCategory: string | null;
  serviceName: string;
  /** Pre-formatted "11. Juni" style (locale month name), never a time (project rule). */
  dateLabel: string;
  price: number | null;
}

export interface ProfileSavedSalonTile {
  slug: string;
  name: string;
  /** Cover photo first, then up to 2 gallery photos. Empty = the sunken fallback. */
  photos: string[];
  city: string | null;
  /** imagery-icons-03 (2026-07-27): salon category label for the collage tile's alt text. */
  category?: string | null;
}

export type ProfileSuggestedSalon = ProfileSavedSalonTile;

type ProfileTab = "saved" | "appointments";

export interface ProfileTabsProps {
  locale: string;
  avatarUrl: string | null;
  displayName: string;
  pastBookings: ProfilePastBookingTile[];
  savedSalons: ProfileSavedSalonTile[];
  /** Real active salons for the "Neu für dich" row, rendered below every tab. */
  suggestedSalons: ProfileSuggestedSalon[];
}

export default function ProfileTabs({
  locale,
  avatarUrl,
  displayName,
  pastBookings,
  savedSalons,
  suggestedSalons,
}: ProfileTabsProps) {
  const t = useTranslations("profileHub");
  const tb = useTranslations("bookingCard");
  const tr = useTranslations("bookingsList");
  const [tab, setTab] = React.useState<ProfileTab>("saved");
  const [query, setQuery] = React.useState("");
  const [sortAlpha, setSortAlpha] = React.useState(false);
  const [rebookingId, setRebookingId] = React.useState<string | null>(null);

  const p = (path: string) => `/${locale}${path}`;
  const firstName = displayName.trim().split(/\s+/)[0] || displayName;

  const q = query.trim().toLowerCase();
  const searchedBookings = q
    ? pastBookings.filter((b) => b.salonName.toLowerCase().includes(q) || b.serviceName.toLowerCase().includes(q))
    : pastBookings;
  const searchedSalons = q ? savedSalons.filter((s) => s.name.toLowerCase().includes(q)) : savedSalons;

  // Default order (as delivered by the page: favorites most-recent-first, bookings
  // most-recent-first) vs alphabetical, toggled by the Sortieren pill.
  const visibleBookings = sortAlpha
    ? [...searchedBookings].sort((a, b) => a.salonName.localeCompare(b.salonName, locale))
    : searchedBookings;
  const visibleSalons = sortAlpha
    ? [...searchedSalons].sort((a, b) => a.name.localeCompare(b.name, locale))
    : searchedSalons;

  // Rebook: reuse the express-rebook API (works from the booking id) to find the next
  // available slot, then confirm it via express-rebook/confirm, same call pattern as
  // components-legacy/booking/BookingsList.tsx's handleRebook.
  async function handleRebook(booking: ProfilePastBookingTile) {
    if (rebookingId) return;
    setRebookingId(booking.id);
    try {
      const response = await fetch("/api/bookings/express-rebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: booking.salonId,
          service_id: booking.serviceId,
          rebook_from_booking_id: booking.id,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Rebook failed: ${response.statusText}`);
      }
      const slot = data.suggestedSlot;
      if (!slot?.slotId) {
        throw new Error(data.error || tr("rebookNoSlot"));
      }
      const confirmRes = await fetch("/api/bookings/express-rebook/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: slot.slotId,
          service_id: data.serviceId,
          staff_id: data.staffId,
          source_booking_id: data.sourceBookingId,
        }),
      });
      if (!confirmRes.ok) {
        const cd = await confirmRes.json().catch(() => ({}));
        throw new Error(cd.error || `Rebook failed: ${confirmRes.statusText}`);
      }
      toast.success(tr("rebookedToast"));
    } catch (err) {
      console.error("[ProfileTabs] Failed to rebook booking:", err);
      toast.error(err instanceof Error ? err.message : tr("rebookError"));
    } finally {
      setRebookingId(null);
    }
  }

  return (
    <div className="max-w-[560px] mx-auto px-4 pb-16">
      {/* Identity anchor row: avatar, first name (the one 28px display anchor), settings gear. */}
      <div className="flex items-center gap-3.5 pt-[18px]">
        <Avatar src={avatarUrl} name={displayName} size={48} />
        <h1 className="min-w-0 flex-1 truncate font-heading text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
          {firstName}
        </h1>
        <Link
          href={p("/profile/settings")}
          aria-label={t("settingsTitle")}
          className="-mr-2.5 grid h-11 w-11 shrink-0 place-items-center text-s-ink"
        >
          <Settings size={24} strokeWidth={1.8} aria-hidden />
        </Link>
      </div>

      {/* Content tabs: sanctioned underline treatment, hairline below the row.
          accessibility-07 (2026-07-27): role=tablist/tab + aria-selected, the WAI-ARIA
          tabs pattern (not aria-pressed, that's for toggle/filter pills per TabPill).
          A screen-reader user tabbing through this previously heard "button, Gespeichert"
          / "button, Termine" with no indication which one was already showing. */}
      <div role="tablist" aria-label={t("tabSaved") + " / " + t("tileAppointments")} className="mt-1.5 flex items-center justify-center gap-6">
        <TabButton id="profile-tab-saved" active={tab === "saved"} onClick={() => setTab("saved")}>
          {t("tabSaved")}
        </TabButton>
        <TabButton id="profile-tab-appointments" active={tab === "appointments"} onClick={() => setTab("appointments")}>
          {t("tileAppointments")}
        </TabButton>
      </div>
      <div className="border-b border-s-border" />

      {/* Search: real client-side filter over the active tab's items */}
      <label className="mt-4 flex h-11 items-center gap-2.5 rounded-[12px] border border-s-border px-[14px]">
        <Search size={20} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent font-body text-[14px] text-s-ink outline-none placeholder:text-s-ink-2"
        />
      </label>

      {/* Sortieren: toggles newest (default order) vs alphabetical for the active tab. */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSortAlpha((v) => !v)}
          aria-pressed={sortAlpha}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-pill border px-[18px] text-[14px] text-s-ink transition-colors",
            sortAlpha ? "border-transparent bg-s-bg-sunken font-semibold" : "border-s-border bg-white font-normal",
          )}
        >
          <ArrowUpDown size={18} strokeWidth={1.9} aria-hidden />
          {t("sortLabel")}
        </button>
      </div>

      {/* Tab content: collage grid (Gespeichert) or the rebook list (Termine).
          accessibility-07: one tabpanel container (the two tab contents are already
          mutually-exclusive `tab === ... &&` branches, never both in the DOM), labeled
          by whichever tab is currently active. */}
      <div id="profile-tabpanel" role="tabpanel" aria-labelledby={tab === "saved" ? "profile-tab-saved" : "profile-tab-appointments"} className="mt-4">
        {tab === "saved" &&
          (visibleSalons.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-2 gap-y-5">
              {visibleSalons.map((s) => (
                <Link key={s.slug} href={p(`/salon/${s.slug}`)} className="min-w-0">
                  <CollageTile photos={s.photos} aspectClass="aspect-[195/131]" name={s.name} category={s.category} />
                  <p className="mt-2 truncate text-[16px] font-semibold text-s-ink">{s.name}</p>
                  {s.city ? <p className="mt-0.5 truncate text-[12px] text-s-ink-2">{s.city}</p> : null}
                </Link>
              ))}
            </div>
          ) : savedSalons.length === 0 ? (
            <EmptyTray
              iconSrc="/icons/categories/spa.png"
              title={t("tabSavedEmpty")}
              message={t("tabSavedEmptyLead")}
              ctaLabel={t("emptyStateCta")}
              ctaHref={p("/search")}
            />
          ) : (
            <EmptyTray title={t("noSearchResults")} message={t("noSearchResultsLead")} />
          ))}

        {tab === "appointments" &&
          (visibleBookings.length > 0 ? (
            <div>
              {visibleBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 border-b border-s-border py-3.5">
                  {b.salonSlug ? (
                    <Link
                      href={p(`/salon/${b.salonSlug}`)}
                      aria-label={b.salonName}
                      className="h-14 w-14 flex-none overflow-hidden rounded-[12px] bg-s-bg-sunken"
                    >
                      <BookingThumb photo={b.salonPhoto} name={b.salonName} category={b.salonCategory} />
                    </Link>
                  ) : (
                    <div className="h-14 w-14 flex-none overflow-hidden rounded-[12px] bg-s-bg-sunken">
                      <BookingThumb photo={b.salonPhoto} name={b.salonName} category={b.salonCategory} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-s-ink">{b.salonName}</p>
                    {b.serviceName ? <p className="truncate text-[14px] text-s-ink-2">{b.serviceName}</p> : null}
                    <p className="mt-0.5 flex items-center gap-2.5 text-[12px] text-s-ink-2">
                      <span>{b.dateLabel}</span>
                      {b.price != null ? <b className="font-semibold text-s-ink">{formatCurrency(b.price, locale)}</b> : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRebook(b)}
                    disabled={rebookingId === b.id}
                    className="flex-none text-[14px] font-semibold text-s-ink disabled:opacity-50"
                  >
                    {tb("rebook")}
                  </button>
                </div>
              ))}
            </div>
          ) : pastBookings.length === 0 ? (
            <EmptyTray
              iconSrc="/icons/categories/scissors.png"
              title={t("tabAppointmentsEmpty")}
              message={t("tabAppointmentsEmptyLead")}
              ctaLabel={t("emptyStateCta")}
              ctaHref={p("/search")}
            />
          ) : (
            <EmptyTray title={t("noSearchResults")} message={t("noSearchResultsLead")} />
          ))}
      </div>

      {/* "Neu für dich": below the active tab on every tab (incl. both empty states), so
          the page never dies into a blank/grey zone. */}
      {suggestedSalons.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
            {t("discoverySectionTitle")}
          </h2>
          <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestedSalons.map((s) => (
              <Link key={s.slug} href={p(`/salon/${s.slug}`)} className="w-[148px] flex-none">
                <CollageTile photos={s.photos} aspectClass="aspect-[148/101]" name={s.name} category={s.category} />
                <p className="mt-2 truncate text-[14px] font-semibold text-s-ink">{s.name}</p>
                {s.city ? <p className="mt-0.5 truncate text-[12px] text-s-ink-2">{s.city}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TabButton({
  id,
  active,
  onClick,
  children,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls="profile-tabpanel"
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "relative shrink-0 py-2.5 font-body text-[18px] transition-colors",
        active ? "font-semibold text-s-ink" : "font-normal text-s-ink-2 hover:text-s-ink",
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-s-ink" aria-hidden /> : null}
    </button>
  );
}

function BookingThumb({ photo, name, category }: { photo: string | null; name?: string | null; category?: string | null }) {
  // accessibility-06: describe WHAT the photo shows (the salon's category), not
  // just whose it is, since the name is already read as adjacent text (line 264).
  const alt = category ? (name ? `${name}, ${category}` : category) : name ? `${name}` : "Salonfoto";
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL, matches SalonPhotoTile convention
    <img src={photo} alt={alt} className="h-full w-full object-cover" />
  ) : (
    <div className="grid h-full w-full place-items-center">
      <Scissors size={18} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
    </div>
  );
}

/** Collage tile (mockup-ok, pinterest-ref-solen): main photo left 66%, up to 2 stacked
 *  thumbs right. 1 photo = a plain full-bleed cover. 0 photos = the sunken fallback with
 *  a category icon, never a bare grey box. */
function CollageTile({ photos, aspectClass, name, category }: { photos: string[]; aspectClass: string; name?: string | null; category?: string | null }) {
  // accessibility-06: describe WHAT the photo shows (the salon's category), not
  // just whose it is, since the name already renders as adjacent text (lines 228/306).
  const altFor = (i: number) => {
    const base = category ? (name ? `${name}, ${category}` : category) : name ? name : "Salonfoto";
    return `${base}, ${i}/${photos.length}`;
  };
  if (photos.length === 0) {
    return (
      <div className={cn("flex w-full items-center justify-center overflow-hidden rounded-card bg-s-bg-sunken", aspectClass)}>
        <Scissors size={22} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
      </div>
    );
  }
  if (photos.length === 1) {
    return (
      <div className={cn("w-full overflow-hidden rounded-card bg-s-bg-sunken", aspectClass)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL */}
        <img src={photos[0]} alt={altFor(1)} className="h-full w-full object-cover" />
      </div>
    );
  }
  const [main, ...rest] = photos;
  const thumbs = rest.slice(0, 2);
  return (
    <div className={cn("flex w-full gap-[2px] overflow-hidden rounded-card bg-s-bg-sunken", aspectClass)}>
      <div className={thumbs.length > 0 ? "flex-[0_0_66%]" : "flex-1"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL */}
        <img src={main} alt={altFor(1)} className="h-full w-full object-cover" />
      </div>
      {thumbs.length > 0 && (
        <div className="flex flex-1 flex-col gap-[2px]">
          {thumbs.map((url, i) => (
            <div key={i} className="flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary Supabase Storage URL */}
              <img src={url} alt={altFor(i + 2)} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** EmptyTray, the reference-grounded empty state (_design-system/research/TASTE_EMPTY_STATES.md,
 *  owner 2026-07-21): a promise headline + a gesture subline + a real filled ink pill CTA,
 *  sitting on the sunken tray. No icon disc, no grey Lucide glyph. The plain "no search
 *  results" case (below the tab's own real empty state) omits the icon + CTA: it is a
 *  transient filter miss, not a first-time-user moment. */
function EmptyTray({
  iconSrc,
  title,
  message,
  ctaLabel,
  ctaHref,
}: {
  iconSrc?: string;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="rounded-card bg-s-bg-sunken px-6 py-9 text-center">
      {iconSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- local sanctioned 3D category icon asset
        <img src={iconSrc} alt="" className="mx-auto h-16 w-16 object-contain" aria-hidden />
      ) : null}
      <p className={cn("font-heading text-[18px] font-semibold text-s-ink", iconSrc ? "mt-3" : undefined)}>{title}</p>
      <p className="mt-1 text-[14px] text-s-ink-2">{message}</p>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-pill bg-s-ink px-6 text-[14px] font-semibold text-white transition-transform duration-150 hover:brightness-[1.08] active:scale-[0.97]"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
