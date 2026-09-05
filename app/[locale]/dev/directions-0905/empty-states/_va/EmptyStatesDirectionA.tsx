// Exists-check: `npm run exists "empty state"` (see empty-states/page.tsx header) plus
// `npm run exists directions-0905` this turn. No REMOVED hit applies to this surface's real
// four render sites (checked against _design-system/REMOVED.md by name before writing).
//
// Grounded-in: components-legacy/ui/EmptyState.tsx (the real locked EmptyState primitive this
// direction's recipe unit copies, see EmptyStateRecipe.tsx), components-legacy/booking/
// BookingsList.tsx (real tab strip + real EmptyState call), app/[locale]/profile/favorites/
// page.tsx, app/[locale]/profile/vouchers/page.tsx, app/[locale]/profile/looks/page.tsx (the
// four real render sites this mockup stacks).
//
// Direction A: Fresha's one-recipe idea (structure) applied through Solen's own locked
// EmptyState anatomy (treatment), never Fresha's own icon style or outline button (see
// Conflicts). VARY axis: only the icon + its colour change across the four states; the
// headline/subline/CTA shape is byte-identical across all four so the critic can overlay them.
//
// Depicts: bookings tab strip + empty state -> components-legacy/booking/BookingsList.tsx
//   (real tab row classes + real `icon={Calendar}` EmptyState call).
// Depicts: favorites empty state -> app/[locale]/profile/favorites/page.tsx (real empty
//   branch, currently rendered via EmptyStateDiscovery; this direction renders it through the
//   plain locked EmptyState anatomy instead, per this file's own stated axis).
// Depicts: vouchers empty state -> app/[locale]/profile/vouchers/page.tsx (real
//   `!hasVouchers && !hasCredit` branch, real `icon={Gift}` EmptyState call).
// Depicts: looks empty state -> app/[locale]/profile/looks/page.tsx (real always-empty
//   branch, currently rendered via EmptyStateDiscovery; same axis note as favorites above).
//
// Sources:
// - _design-system/references/fresha--empty-states.md: "the same four-part recipe regardless
//   of what is empty: one small icon (colour is the only thing that varies), a bold one-line
//   headline naming the missing thing plainly, a grey one-line subline explaining when it will
//   fill in, and exactly one button." That file's own Conflicts section already flags Fresha's
//   icon STYLE (a purple-pink gradient family) and its outline-button default as things Solen's
//   lock does not adopt; this file keeps Solen's lock on both (filled ink CTA, no gradient
//   illustration system), taking only the STRUCTURE from Fresha.
// - CLAUDE.md design contract, "states" row: the locked anatomy itself (promise headline
//   18/600, gesture subline, filled ink CTA, icon on the sunken tray, never a grey Lucide disc).
// - messages/en.json, grepped at each real render site (BookingsList.tsx, profile/favorites,
//   profile/vouchers, profile/looks): bookingsList.noBookings/bookingsListUi.emptyUpcoming,
//   profileFavorites.title/lead, vouchers.profile.emptyBoth, looks.title/lead. One new line
//   (vouchers headline) is written in THIS file, in English, see the inline note below.
// - Icons: Calendar (bookingsList's own real `icon={Calendar}`), Heart (the real, sitewide
//   saved-colour semantic, see EmptyStateDiscovery.tsx's hardcoded `#FF3366` + CLAUDE.md rule 4
//   "save-heart #FF3366"), Gift (real `icon={Gift}` on the vouchers page's own EmptyState call),
//   Bookmark (the real `hintIcon="bookmark"` the looks page already passes to
//   EmptyStateDiscovery). No invented icon.
// - CTA targets: "Book now" (Profile.bookNow) -> /{locale} (search/home); "Discover salons"
//   (common.discoverSalons, the same string used sitewide at recentlyViewed.emptyCta,
//   Profile.discoverSalons) -> /{locale}/inspo, matching the real favorites/looks pages' own
//   `bannerHref`; "Give a new voucher" (vouchers.profile.buyNew) -> /{locale}/vouchers, the
//   real page's own CTA target.
//
// Conflicts (Solen locks KEPT, this is not the LOOK-FULL direction):
// - icon system: kept Solen's own icon choice (real Lucide icons already used at each render
//   site) over Fresha's gradient-illustration family (CONFLICT already logged in
//   fresha--empty-states.md, resolved there in favour of the existing lock, same call here).
// - CTA fill: kept Solen's filled-ink CTA on every state (two of Fresha's three real states use
//   an outline pill; CONFLICT already logged in the same file, resolved the same way).
// - grey-tile-behind-icon: the REAL components-legacy/ui/EmptyState.tsx wraps its icon in a
//   bg-s-bg-sunken circle; the pre-edit drift gate (A25) refuses that shape in a new file and
//   the contract's own words already ban it ("never a grey Lucide disc"), so this is the real
//   component drifting off its own lock, not a value to carry forward. See EmptyStateRecipe.tsx
//   for the fix (icon at 48px directly on the sunken tray, no separate box).
// - CTA size: the real vouchers.profile empty state ships its button at 14px; the design
//   contract locks CTA text at >=15px ("never <=13 on a button"). This file's own new CTA uses
//   15px, matching the lock, not the live page's drifted 14px. Flagged, not fixed elsewhere.
//
// Floors (customer screen, all four states share one answer, this is a genuinely empty family
// of screens so several of these are honest "no" or "waived", named rather than faked):
// (a) photographic focal: N/A by design. The locked "states" anatomy for THIS screen type is
//     icon-led, not photo-led (3D category icon or ghost-preview, never a photo slot); neither
//     Fresha's nor Airbnb's own empty-state captures show a photo either (both reference files,
//     read in full this turn, show icon/illustration-only anatomies). Not a gap, a different
//     screen family, same as the design contract's own "Exempt" list already carves out forms/
//     checkout/legal/receipts for the identical reason.
// (b) exactly one biggest element: yes, the 48px icon is the single largest element in each
//     unit, followed by the 18px/600 headline.
// (c) at least one tabular/real number: genuinely absent. A true zero-content state has no
//     number to show without inventing one; neither live production page nor either reference
//     spec shows one in this exact state family. Named as a gap rather than faked, the same
//     waiver hierarchy-density-04 already grants a below-floor real section (no-fabrication
//     over a floor count).
// (d) semantic-colour moment: yes, twice. Favorites uses the real, sitewide save-heart hue
//     #FF3366; vouchers uses `text-s-warning-text` (hue-ok: quoting the LOCKED tailwind.config.js
//     token's own literal value, not a new hex), the token's own documented "darker companion"
//     variant, since bare `s-warning`/`s-star` fail the 3:1 graphical floor alone per CLAUDE.md's
//     contrast table. Bookings and looks stay neutral ink-2: no natural semantic hue exists for
//     a bare calendar or bookmark concept, and forcing one would be inventing a mapping the
//     system does not define.
// (e) no dead-grey zone: each unit sits inside its own `bg-s-bg-sunken rounded-[24px]` tray on
//     the real page's white background, alternating rhythm down the stacked page.
// (f) worst-case content holds: the longest real string here (looks.lead, two sentences) still
//     fits the `max-w-xs` message column without truncating load-bearing copy.
//
// Omitted from this mockup, and why: the real vouchers page also renders an unconditional
// credit-balance card above its empty state, and the real favorites/looks pages render inside
// a full-width EmptyStateDiscovery (banner photo + rail of real salons) rather than the plain
// EmptyState. Direction A's own idea is the ONE-RECIPE comparison across all four states; adding
// each page's own extra chrome back in would re-introduce four different anatomies, exactly what
// this direction argues against. The tab strip above the bookings state is kept because it is
// the one piece of real per-state navigation context (Upcoming/Past/Cancelled), not decoration.

import { getTranslations } from "next-intl/server";
import { Calendar, Heart, Gift, Bookmark } from "lucide-react";
import EmptyStateRecipe from "./EmptyStateRecipe";

export default async function EmptyStatesDirectionA({ locale }: { locale: string }) {
  const tBookings = await getTranslations({ locale, namespace: "bookingsList" });
  const tBookingsUi = await getTranslations({ locale, namespace: "bookingsListUi" });
  const tFavorites = await getTranslations({ locale, namespace: "profileFavorites" });
  const tVouchers = await getTranslations({ locale, namespace: "vouchers.profile" });
  const tLooks = await getTranslations({ locale, namespace: "looks" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tProfile = await getTranslations({ locale, namespace: "Profile" });

  const discoverSalons = tCommon("discoverSalons");

  return (
    <div className="bg-white">
      {/* 1. No upcoming bookings , real page shell: components-legacy/booking/BookingsList.tsx's
          own tab row (Upcoming/Past/Cancelled), classes copied verbatim, "Upcoming" active. */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-8">
        <div className="flex gap-2 border-b border-s-border mb-6">
          <span className="px-4 py-3 font-semibold text-sm border-b-2 border-s-ink text-s-ink">
            {tBookings("upcoming")}
          </span>
          <span className="px-4 py-3 font-semibold text-sm border-b-2 border-transparent text-s-ink-2">
            {tBookings("past")}
          </span>
          <span className="px-4 py-3 font-semibold text-sm border-b-2 border-transparent text-s-ink-2">
            {tBookings("cancelled")}
          </span>
        </div>
        <div className="rounded-[24px] bg-s-bg-sunken">
          <EmptyStateRecipe
            icon={<Calendar size={48} strokeWidth={1.5} className="text-s-ink-2" />}
            title={tBookings("noBookings")}
            message={tBookingsUi("emptyUpcoming")}
            actionLabel={tProfile("bookNow")}
            actionHref={`/${locale}`}
          />
        </div>
      </section>

      {/* 2. No favorites yet , real page shell: max-w-2xl container, matching
          app/[locale]/profile/favorites/page.tsx's own <main> classes. */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-[24px] bg-s-bg-sunken">
          <EmptyStateRecipe
            icon={<Heart size={48} strokeWidth={1.5} className="text-[#FF3366]" />}
            title={tFavorites("title")}
            message={tFavorites("lead")}
            actionLabel={discoverSalons}
            actionHref={`/${locale}/inspo`}
          />
        </div>
      </section>

      {/* 3. No active vouchers , real page shell: app/[locale]/profile/vouchers/page.tsx's
          own `min-h-screen bg-s-bg-surface px-4 py-8` / `mx-auto max-w-lg` container (credit
          card above the empty state omitted, see the header note). One new line: this
          namespace's real render site passes the page TITLE ("My vouchers") as the EmptyState
          headline, which does not name the missing thing per the locked anatomy. The sibling
          keys profileFavorites.title / looks.title already use a "No X yet." shape for the
          exact same job; this file writes the same shape here, in English, so the recipe stays
          comparable across all four ("No vouchers yet."), and reuses the REAL `emptyBoth`
          string for the subline unchanged. */}
      <section className="bg-s-bg-surface px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-lg">
          <div className="rounded-[24px] bg-s-bg-sunken">
            <EmptyStateRecipe
              icon={<Gift size={48} strokeWidth={1.5} className="text-s-warning-text" />}
              title="No vouchers yet."
              message={tVouchers("emptyBoth")}
              actionLabel={tVouchers("buyNew")}
              actionHref={`/${locale}/vouchers`}
            />
          </div>
        </div>
      </section>

      {/* 4. No looks yet , real page shell: max-w-2xl container, matching
          app/[locale]/profile/looks/page.tsx's own <main> classes. */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <div className="rounded-[24px] bg-s-bg-sunken">
          <EmptyStateRecipe
            icon={<Bookmark size={48} strokeWidth={1.5} className="text-s-ink-2" />}
            title={tLooks("title")}
            message={tLooks("lead")}
            actionLabel={discoverSalons}
            actionHref={`/${locale}/inspo`}
          />
        </div>
      </section>
    </div>
  );
}
