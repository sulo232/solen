"use client";

// exists-check: `npm run exists directions-0905` -> the scaffold page + sibling
// directions of other surfaces (read, not touched). `npm run exists "empty state"` ->
// components-legacy/ui/EmptyState.tsx (the primitive this direction restyles),
// DiscoveryEmptyState.tsx and app/[locale]/_components/profile/EmptyStateDiscovery.tsx
// (the richer real component favorites/looks actually render today, read below and
// named as a broken lock, not imported); two graveyard hits returned, neither is this
// surface, not re-proposed. Net-new: this exact file (`EmptyStatesDirectionB`) -> 0
// hits before this pass.
//
// Grounded-in: components-legacy/ui/EmptyState.tsx (the primitive this direction
// restyles), components-legacy/booking/BookingsList.tsx, app/[locale]/profile/
// favorites/page.tsx, app/[locale]/profile/vouchers/page.tsx, app/[locale]/profile/
// looks/page.tsx (the four real render sites this EmptyStatesDirectionB file re-shells).
//
// Direction: AIRBNB PER-FEATURE, FULL STRENGTH. Declared axis: LOOK. Every one of the
// four states gets Airbnb's own type scale, ink value, secondary grey and filled-pill
// CTA recipe (_design-system/references/airbnb--look-recipe.md), replacing Solen's
// locked <EmptyState> anatomy (18/600 headline, 3D category icon, sunken tray, ink CTA)
// at full strength, broken locks named below. The shared thing across all four states is
// the COPY SHAPE ONLY (name what's missing, explain when it fills, one action), per
// airbnb--empty-states.md's own Philosophy section; the icon differs per state because
// Airbnb itself uses no single icon system across its own empty states (that file's own
// Philosophy: "Airbnb does not use one illustration system across its own empty states").
//
// Depicts: bookings tab shell (Upcoming/Past/Cancelled) -> components-legacy/booking/BookingsList.tsx
// Depicts: bookings empty headline+subline -> components-legacy/booking/BookingsList.tsx (t('noBookings'), tUi('emptyUpcoming'))
// Depicts: favorites page shell -> app/[locale]/profile/favorites/page.tsx
// Depicts: favorites empty headline+subline -> app/[locale]/profile/favorites/page.tsx (t('title'), t('lead'))
// Depicts: vouchers page shell -> app/[locale]/profile/vouchers/page.tsx
// Depicts: vouchers empty headline+subline -> app/[locale]/profile/vouchers/page.tsx (t('title'), t('emptyBoth'))
// Depicts: looks page shell -> app/[locale]/profile/looks/page.tsx
// Depicts: looks empty headline+subline -> app/[locale]/profile/looks/page.tsx (t('title'), t('lead'))
// Depicts: bookings CTA copy -> app/[locale]/profile/vouchers/page.tsx (messages/en.json home.cta.findSalon, "Find salon", not currently wired to any caller; reused verbatim as this state's fill-the-void action since production BookingsList ships no CTA at all today, an omission Fresha and Airbnb both fill)
// Depicts: favorites/looks CTA copy -> app/[locale]/profile/favorites/page.tsx (messages/en.json profileFavorites.bannerTitle / looks.bannerTitle, "Open Inspo", same destination the real bannerHref already uses)
// Depicts: vouchers CTA copy -> app/[locale]/profile/vouchers/page.tsx (t('buyNew'), "Give a new voucher", same href /vouchers the real button already uses)
//
// No live data read: per the surface brief ("Four states on one route, in this order"),
// this is a scripted demonstration of the EMPTY treatment for all four slots, not a live
// query of the seed customer's actual state (kunde@solen.ch genuinely has bookings,
// favorites and vouchers today; only /profile/looks is genuinely empty for that account,
// used for the live cheat-check route instead). Rendering all four as empty here is the
// direction's job, not a claim about today's real counts, so no admin-client read runs in
// this file and no number is ever displayed, which avoids the no-invented-numbers concern
// entirely: there is no data on this page, real or otherwise.
import { Calendar, Heart, Ticket, Images } from "lucide-react";
import { AirbnbEmptyUnit } from "./AirbnbEmptyUnit";

const AIRBNB_INK = "#222222"; // drift-ok: same Airbnb-measured ink as AirbnbEmptyUnit.tsx, tab label colour
const AIRBNB_SECONDARY_GREY = "#6C6C6C"; // drift-ok: same Airbnb-measured secondary grey as AirbnbEmptyUnit.tsx, inactive tab label
const HEART_RED = "#FF3366"; // hue-ok: taste rule 4's own universal save-heart colour, legal as an icon; this direction's one semantic-colour moment (floors item d)

export function EmptyStatesDirectionB() {
  return (
    <div className="bg-white">
      {/* ---- 1. Bookings (BookingsList.tsx tab shell) ---- */}
      <section className="border-b border-s-border">
        <div className="flex items-center gap-1 px-4 pt-4">
          {["Upcoming", "Past", "Cancelled"].map((label, i) => (
            <span
              key={label}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={
                i === 0
                  ? { backgroundColor: "#F4F4F5", color: AIRBNB_INK, fontWeight: 600 }
                  : { color: AIRBNB_SECONDARY_GREY }
              }
            >
              {label}
            </span>
          ))}
        </div>
        <AirbnbEmptyUnit
          index={0}
          icon={Calendar}
          headline="No bookings yet"
          subline="Book your next treatment now"
          ctaLabel="Find salon"
          ctaHref="/en/search"
        />
      </section>

      {/* ---- 2. Favorites (profile/favorites/page.tsx shell) ---- */}
      <section className="border-b border-s-border">
        <AirbnbEmptyUnit
          index={1}
          icon={Heart}
          iconColor={HEART_RED}
          headline="No favorites yet."
          subline="Tap the heart on a salon and it lands here, your shortlist for next time."
          ctaLabel="Open Inspo"
          ctaHref="/en/inspo"
        />
      </section>

      {/* ---- 3. Vouchers (profile/vouchers/page.tsx shell) ---- */}
      <section className="border-b border-s-border">
        <AirbnbEmptyUnit
          index={2}
          icon={Ticket}
          headline="My vouchers"
          subline="You don't have any vouchers or credit yet."
          ctaLabel="Give a new voucher"
          ctaHref="/en/vouchers"
        />
      </section>

      {/* ---- 4. Looks (profile/looks/page.tsx shell) ---- */}
      <section>
        <AirbnbEmptyUnit
          index={3}
          icon={Images}
          headline="No looks yet."
          subline="Collect inspiration from salon profiles and Inspo, and find it again here."
          ctaLabel="Open Inspo"
          ctaHref="/en/inspo"
        />
      </section>
    </div>
  );
}
