"use client";

// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md ("ContinueCard") and doc
// written at _design-system/components/ContinueCard.md, both in this same turn.
// exists-check: ran `npm run exists homepage` this turn (35 existing homepage components listed,
// none named or shaped like a priority-state resume card) plus `npm run exists "continue card"`
// (1 hit, a graveyard entry for a DELETED second mockup page, not a real component),
// `npm run exists "upcoming booking"` (0 hits) and `npm run exists "live activity"` (1 unrelated
// dashboard-rail graveyard hit). Read homepage/WalkInBand.tsx in full first (closest real match:
// self-fetch + self-hide card) and reused its pattern rather than inventing a new one. Net-new
// vs the rest of the exists-guard list: Reviews.tsx/SearchBar.tsx/SalonCard.tsx/
// SalonOfMonth.tsx/PopularLooks.tsx (unrelated card/section anatomy, no priority-state
// resolver), forYouSalons.ts/salonCardData.ts (curated id lists + server data fetchers, not a
// component). Extends nothing directly; composes the already-shipped useRecentSearches.ts hook
// and the already-shipped GET /api/bookings/user?tab=upcoming endpoint, both untouched.
//
// ContinueCard, I7 (2026-08-01, home rails reconciliation with
// public/_mockups/home-v3/search-a.html continuationCard()/CONT_STATES): the home's first
// element, ONE real state at a time. The mockup previews six states (search continuation,
// booking confirmed, walk-in queue position, payment pending, cancelled, review prompt) behind
// a dot-picker; only two are backed by a real, already-shipped customer-side query this turn.
// Full per-state investigation and reasoning: _design-system/components/ContinueCard.md.
//   1. an upcoming confirmed booking: GET /api/bookings/user?tab=upcoming (bookings.status =
//      "confirmed" AND starts_at >= now, already shipped, the same query /profile's Termine
//      list reads from).
//   2. a persisted recent search: useRecentSearches() (localStorage, already shipped, written
//      by SearchOverlay.tsx on every real search submit).
// NOT built, per the task's own "build only states backed by real data" instruction: walk-in
// queue position (no customer-facing "my active ticket" query exists), payment pending (no
// hold-expiry timestamp anywhere), cancelled (no recency-window rule, no cancelled-by column),
// review prompt (no existing anti-join against reviews.booking_id). See ContinueCard.md.
// Renders null (no card) for a logged-out visitor with no recent search, the same self-hide
// contract WalkInBand / RecentlyViewedTiles / PopularLooks already use on this page.

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRecentSearches, recentLabel } from "./useRecentSearches";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Search } from "lucide-react";

type BookingSalon = { slug: string | null; name: string | null; cover_photo_url: string | null };
type BookingService = { name_de: string | null; name_en: string | null };
type UpcomingBookingRow = {
  id: string;
  starts_at: string;
  salon: BookingSalon | BookingSalon[] | null;
  service: BookingService | BookingService[] | null;
};

// Same defensive shape-normalizer app/[locale]/profile/page.tsx already uses for this exact
// API's nested salon/service join (Supabase returns an object or a 1-item array depending on
// FK detection).
function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default function ContinueCard() {
  const locale = useLocale();
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const t = useTranslations("bookingCard");
  const tContinue = useTranslations("home.continueCard");
  const { recent } = useRecentSearches();

  // undefined = still resolving the auth-gated fetch; null = resolved, no upcoming booking.
  const [booking, setBooking] = React.useState<
    { salon: BookingSalon; serviceName: string; startsAt: string } | null | undefined
  >(undefined);

  React.useEffect(() => {
    let active = true;
    // A local session only gates this optional request; the API still verifies identity.
    createBrowserSupabaseClient()
      .auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) throw error;
        if (!active || !session) return { bookings: [] };
        return fetch("/api/bookings/user?tab=upcoming").then((r) => (r.ok ? r.json() : { bookings: [] }));
      })
      .then((d) => {
        if (!active) return;
        const row = (d.bookings?.[0] as UpcomingBookingRow | undefined) ?? null;
        const salon = row ? one(row.salon) : null;
        if (!row || !salon?.name) {
          setBooking(null);
          return;
        }
        const service = one(row.service);
        const serviceName =
          (service?.[`name_${locale}` as keyof BookingService] as string | undefined) ||
          service?.name_de ||
          service?.name_en ||
          "";
        setBooking({ salon, serviceName, startsAt: row.starts_at });
      })
      .catch((err) => {
        console.error("[ContinueCard] failed to load upcoming booking:", err);
        if (active) setBooking(null);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  // Still resolving: render nothing rather than flash the search-continuation fallback and then
  // swap to a booking a beat later.
  if (booking === undefined) return null;

  if (booking) {
    const when = new Intl.DateTimeFormat(localeCode, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(booking.startsAt));
    return (
      <div className="mb-5 mx-auto max-w-[1280px] px-4 md:px-6">
        <ContinueShell
          href={booking.salon.slug ? `/${locale}/salon/${booking.salon.slug}` : `/${locale}/search`}
          eyebrow={t("status.confirmed")}
          eyebrowTone="ok"
          title={booking.salon.name ?? ""}
          meta={booking.serviceName ? `${booking.serviceName}, ${when}` : when}
          photoUrl={booking.salon.cover_photo_url}
        />
      </div>
    );
  }

  // Owner-approved 2026-08-15: the card reads as a SENTENCE, "Continue searching for skin fades in
  // Basel", because the bare search term alone never said it was a resumed search. His words:
  // "what you search for, you can't really identify what your last [search was]". Measured on his
  // Airbnb screenshot: the reference headline is a sentence over two lines at roughly 17pt.
  // One card per recent search, up to 3, in a rail so the next one is visibly cropped. With a
  // single recent search there is nothing to crop, so it goes full width instead of leaving a
  // lone 306px card stranded on a 402px screen.
  const searches = recent.slice(0, 3);
  if (searches.length > 0) {
    // Same 3-param "resume a recent search" contract SearchOverlay.tsx's own handleRecentClick
    // uses (q/service/city only, a recent never carries the date back, by owner rule: "a stale
    // date re-applied from a past search gets fucked up").
    const hrefFor = (x: (typeof searches)[number]) => {
      const sp = new URLSearchParams();
      if (x.query) sp.set("q", x.query);
      if (x.service) sp.set("service", x.service);
      if (x.city) sp.set("city", x.city);
      const qs = sp.toString();
      return `/${locale}/search${qs ? `?${qs}` : ""}`;
    };
    const fallback = tContinue("searchFallback");

    if (searches.length === 1) {
      return (
        <div className="mb-5 mx-auto max-w-[1280px] px-4 md:px-6">
          <ContinueShell
            href={hrefFor(searches[0])}
            lead={tContinue("searchingFor")}
            title={recentLabel(searches[0], fallback)}
          />
        </div>
      );
    }
    return (
      <div className="mb-5 mx-auto max-w-[1280px] px-4 md:px-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* No -mx-4 bleed. Measured 2026-08-15: with the bleed the first card landed at left 0
            while the category pills and every section heading sit at 16, because this parent
            carries no horizontal padding of its own for the negative margin to cancel. The
            owner drew a red line down that edge once already. */}
        <div className="flex gap-3">
          {searches.map((x, i) => (
            <div key={`${recentLabel(x, fallback)}-${i}`} className="w-[306px] shrink-0">
              <ContinueShell
                href={hrefFor(x)}
                lead={tContinue("searchingFor")}
                title={recentLabel(x, fallback)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function ContinueShell({
  href,
  eyebrow,
  eyebrowTone,
  lead,
  title,
  meta,
  photoUrl,
}: {
  href: string;
  eyebrow?: string;
  eyebrowTone?: "ok";
  /** Quiet lead-in that turns the title into a sentence, e.g. "Continue searching for". */
  lead?: string;
  title: string;
  meta?: string;
  photoUrl?: string | null;
}) {
  return (
    /* SHADOW = elevation-3, and this is a DEVIATION from the surface table, surfaced not hidden.
       Owner 2026-08-15: "the shadow is barely invisible. Like, I can't even see anything on the
       card." He is right. I rendered all three candidates on the real page and looked:
         elevation-2  0 2px 8px rgba(50,47,44,0.09)                     no visible edge on white
         whisper      0 1px 3px 0.04 + 0 10px 28px -14px 0.10           barely a bottom edge
         elevation-3  0 6px 16px rgba(50,47,44,0.12)                    a defined edge all round
       THE COLLISION, stated rather than quietly resolved: FLOORS LAW 4 gives three ways to make an
       elevated container visible, (a) sit it on the sunken tray, (b) a flush photo edge, or (c) on
       white keep the hairline OR step to elevation-2. He has rejected (a) by name this same day
       ("what is this gray divided shit"), (b) does not apply now that the card carries no photo,
       and of (c) he rejected the hairline ("why did you make it flat? Make a shadow") and cannot
       see elevation-2. Every option the rule offers is spent, so the card takes the next step up.
       His live instruction outranks the token table in the precedence chain; the table should
       probably gain a "card on white with no photo" row, which is his call, not mine.

       The rest, measured rather than chosen: He asked for the shadow back by name. The locked surface table says a
           card carrying elevation drops its border and never carries both, so the hairline went.
         PHOTO 87 x 70, ratio 1.24, our house 5:4. It was 88 SQUARE, which he rejected by name
           more than once ("what the fuck is it fucking square").
         SENTENCE HEADLINE at 17px/22px, the lead-in quiet and the subject in ink, so the card says
           what the last search WAS. Measured on his Airbnb screenshot: two lines, 19.4pt baseline
           to baseline, which puts the reference near 17pt against the 14px we were drawing.
       The grey band this used to sit on is gone; he called it "gray divided shit". */
    <Link
      href={href}
      className="flex h-[118px] w-full items-center gap-3.5 rounded-[18px] bg-white p-4 shadow-elevation-3 transition-transform duration-150 ease-glide active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1">
        {eyebrow && (
          <span
            className={`mb-[3px] inline-flex items-center gap-[5px] font-body text-[12px] font-semibold ${
              eyebrowTone === "ok" ? "text-s-success" : "text-s-ink-2"
            }`}
          >
            <span
              className={`h-[7px] w-[7px] shrink-0 rounded-full ${eyebrowTone === "ok" ? "bg-s-success" : "bg-s-ink-2"}`}
              aria-hidden
            />
            {eyebrow}
          </span>
        )}
        <span className="line-clamp-2 block font-display text-[17px] font-normal leading-[22px] tracking-[-0.01em] text-s-ink-2">
          {lead ? `${lead} ` : ""}
          <span className="font-semibold text-s-ink">{title}</span>
        </span>
        {meta && <span className="mt-[3px] block truncate font-body text-[12px] text-s-ink-2">{meta}</span>}
      </span>
      {/* THE SEARCH ICON IS BACK, WITHOUT THE BOX. Owner 2026-08-15: "put, like, a search icon.
          You can do that, but don't do, like, how you did it before. You know? That looks so
          weird." What looked weird was the CONTAINER, a 87x70 sunken rectangle standing in for a
          photo. The icon alone, no fill, no border, sized to the text rather than to a photo slot,
          is a mark on the card instead of a fake image. It also keeps the card honest: a search is
          not a place, so it gets a symbol, not a picture frame. */}
      {!photoUrl && (
        <span className="shrink-0 self-center pr-1 text-s-ink-2" aria-hidden>
          <Search size={26} strokeWidth={1.75} />
        </span>
      )}
      {/* NO PHOTO SLOT WHEN THERE IS NO PHOTO. Owner 2026-08-15, and he had said it before:
          "You keep making this icon instead of a gray boxing. I told you I don't like this at all
          ... Where is this coming from? Fix the core problem."
          The core: CLAUDE.md's imagery rule says a missing photo gets "sunken bg + category icon +
          initial, NEVER a bare grey box". That fallback is defined for a SALON. A recent SEARCH has
          no salon, so it has no category icon and no initial to fall back TO, and what shipped was a
          sunken box with a generic magnifier, which is exactly the bare grey box the rule bans,
          wearing a glyph. The slot only existed because this card's layout was ported from one that
          assumes an entity with a photo. No entity, no slot: the sentence takes the whole card. */}
      {photoUrl && (
        <span className="relative h-[70px] w-[87px] shrink-0 overflow-hidden rounded-[14px] bg-s-bg-sunken">
          <Image src={photoUrl} alt="" fill sizes="87px" className="object-cover" />
        </span>
      )}
    </Link>
  );
}
