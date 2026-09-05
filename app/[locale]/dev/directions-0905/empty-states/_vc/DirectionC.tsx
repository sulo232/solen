"use client";

// Grounded-in: components-legacy/booking/BookingsList.tsx + BookingCard.tsx (state 1),
// app/[locale]/profile/favorites/page.tsx + app/[locale]/_components/homepage/SalonCard.tsx
// (state 2), app/[locale]/profile/referral/page.tsx (state 3), app/[locale]/profile/looks/page.tsx
// + components-legacy/discovery/ItemCard.tsx (state 4). Every one of these four real files is
// read and copied from below; see the per-state notes further down for the exact anatomy
// each state reuses.
//
// Exists-check: `npm run exists EmptyState` (see page.tsx's own header) found the locked
// primitive this surface treats. This file does NOT import EmptyState.tsx: direction C's
// whole idea is that the icon+headline+message+CTA slot is replaced by REAL content, so
// there is no icon and no generic message to render through that component. The promise
// headline (locked anatomy: "PROMISE headline 18/600, never a bare status label") is the
// one piece of that anatomy this direction keeps.
//
// REPAIR (critic round 1, fixed here): the four h3 headlines were rendering the SUBLINE/
// gesture key, never the real promise-title key. Now each h3 is the exact title the live
// EmptyState render site for that feature uses, and the old h3 text is demoted to a 14px
// subline underneath: state 1 -> bookingsList.noBookings ("No bookings yet"), read at
// components-legacy/booking/BookingsList.tsx:225 (`title={t('noBookings')}`), subline =
// bookingsListUi.emptyUpcoming (the gesture line, same key as before). State 2 ->
// profileFavorites.title ("No favorites yet."), read at
// app/[locale]/_components/profile/EmptyStateDiscovery's caller,
// app/[locale]/profile/favorites/page.tsx:110 (`title={t("title")}`), subline =
// profileFavorites.lead (same key as before). State 4 -> looks.title ("No looks yet."),
// read at app/[locale]/profile/looks/page.tsx:51 (`title={t("title")}`), subline =
// looks.lead (same key as before).
//
// State 3 is the one slot the direction deliberately fills with a DIFFERENT feature's
// content (the referral card answers "no vouchers" because referral credit is spendable
// balance, per the direction brief), so its promise title is the VOUCHERS page's own,
// vouchers.profile.title ("My vouchers"), read at app/[locale]/profile/vouchers/page.tsx:147
// (`title={t("title")}`, namespace "vouchers.profile" exactly as that live page declares
// it). CONFLICT, noted rather than invented: no existing copy key states the actual causal
// link ("credit you earn by referring a friend shows up here as a voucher/credit balance").
// The closest real copy is vouchers.profile.emptyBoth ("You don't have any vouchers or
// credit yet.", the live vouchers EmptyState's own `message` prop, the one string that
// already names vouchers AND credit together), used here as the subline; the referral
// hero's own explanation (profileReferral.heroSubtitle) is kept as a small caption above
// the code card, exactly where the real referral page renders it (its "Hero card"), so the
// mechanism is still shown in real referral copy, just not asserted as a direct "this
// becomes a voucher" sentence nobody wrote.
//
// Size-budget fix: text-2xl (24px) stat numbers folded into the 18px tier (data-text
// font-medium text-[18px]); the text-base (16px) "Your stats" label folded into 14px
// (text-sm). This direction's own markup now carries exactly 3 sizes (12/14/18), inside the
// 4-size ceiling.
//
// Depicts: tab strip (state 1) -> components-legacy/booking/BookingsList.tsx:150-176
//   (copied as a static, Upcoming-active strip; this direction fills the Upcoming tab's
//   empty slot, so Past/Cancelled stay inert page structure, not part of the fill).
// Depicts: book-again rows -> components-legacy/booking/BookingCard.tsx, imported as-is
//   (real component, not redrawn), fed 2 real past bookings for the seed customer's last
//   two distinct salons (loadDirectionC.ts). onRebook/onReschedule/onCancel are omitted
//   (undefined): the real handlers POST to /api/bookings/*, which would be a live write
//   from a /dev preview; the card's own optional-chaining (`onRebook?.(booking)`) makes an
//   absent handler a no-op tap rather than a broken one. The card's own Link still
//   navigates to the REAL salon PDP (`/salon/[slug]`), so the tap target is not dead.
// Depicts: nearby-salon rail (state 2) -> app/[locale]/_components/homepage/SalonCard.tsx,
//   the exact card component app/[locale]/profile/favorites/page.tsx already feeds from the
//   same getSalonCardDataMap batch fetch. The horizontal scroll TRACK around it is a plain
//   flex/overflow-x wrapper here rather than a shared section-header helper, to keep this
//   file's imports to the one component the brief names ("the same SalonCard the home page
//   uses"), not that helper's whole section family.
// Depicts: referral card (state 3) -> app/[locale]/profile/referral/page.tsx's own "Referral
//   code card" + "Stats" card JSX, reproduced with real /api/referral-equivalent data
//   (loadDirectionC.ts reads the same tables that route reads, server-side, read-only).
// Depicts: looks grid (state 4) -> components-legacy/discovery/ItemCard.tsx's own
//   `displayImage` resolution (tiktok source -> the refresh-proxy route, else the stored
//   image/thumbnail), reused as plain logic; the tile itself is a new, deliberately NON-
//   interactive presentational element (no heart/like/save), because ItemCard's own heart
//   posts to a real save endpoint and a save control with no working session context would
//   be a dead affordance. Two-column grid per the brief (not ItemCard's own masonry).
//
// Motion: _design-system/references/airbnb--motion.md's measured 50ms stagger step
// ("(c) Search sheet expand", destination-list rows: 50/100/150/200ms; "(g) Back
// navigation", card-grid stagger: 0/50/100ms), applied as the `delay` step between
// entrances. The per-item entrance itself is Solen's OWN locked ENTER RECIPE
// (_design-system/MOTION.md "THE ENTER RECIPE"): opacity 0->1, scale 0.96->1,
// blur 8px->0, 280ms, ease cubic-bezier(0.16,1,0.3,1) ("glide"). NOTE: the brief text
// describing this recipe said "opacity, y and scale together"; MOTION.md's actual locked
// table (the source, not the paraphrase) has no y-translate at all, it is opacity + scale +
// blur. Per "the stills win" (or here, the source doc wins over a paraphrase of it), this
// file follows MOTION.md's real three properties, not "y".
//
// emphasis-ok: every weight>=600 spot below is a required, single anchor, not decoration:
// the 4 promise headlines are locked at 18/600 by the brief itself (one per state, never a
// second bold element per section); the active tab label follows the design contract's own
// tab-weight rule (active weight 600 with an ink underline, inactive weight 400 ink-2), so
// the two inactive tabs below are deliberately font-medium even though the live
// BookingsList.tsx bolds all three (a live drift from that same rule, not copied here); the
// referral code is the one real value that card exists to show. The two referral stat
// numbers stay font-medium (not bold) here, one anchor per card is the budget, not one
// anchor per number inside it.

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Users, Gift, Copy, Check } from "lucide-react";
import BookingCard from "@/components-legacy/booking/BookingCard";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import { formatCurrency } from "@/lib/format-currency";
import type { DirectionCData } from "./loadDirectionC";

const GLIDE = [0.16, 1, 0.3, 1] as const; // _design-system/MOTION.md THE ENTER RECIPE curve
const STAGGER_STEP = 0.05; // 50ms, airbnb--motion.md measured stagger step

const enterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: GLIDE, delay: i * STAGGER_STEP },
  }),
};

function Enter({
  i,
  className,
  children,
}: {
  i: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div className={className} custom={i} initial="hidden" animate="visible" variants={enterVariants}>
      {children}
    </motion.div>
  );
}

/** Plain content divider between the four stacked real-shell copies on this one comparison
 * route. Reuses DirectionFrame's own established strip recipe (12px, text-s-ink-2, a
 * hairline, a colon separator) rather than inventing a second label style, so this reads as
 * one more instance of a pattern already on the page, not a new piece of chrome. */
function StateDivider({ index, label }: { index: number; label: string }) {
  return (
    <div className="flex h-11 items-center border-b border-t border-s-border bg-white px-4">
      <span className="text-[12px] text-s-ink-2">{`State ${index} of 4: ${label}`}</span>
    </div>
  );
}

export default function DirectionC({ data }: { data: DirectionCData }) {
  const locale = useLocale();
  const tBookingsList = useTranslations("bookingsList");
  const tBookingsListUi = useTranslations("bookingsListUi");
  const tFavorites = useTranslations("profileFavorites");
  const tReferral = useTranslations("profileReferral");
  const tVouchers = useTranslations("vouchers.profile");
  const tLooks = useTranslations("looks");
  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    if (!data.referral.referralCode) return;
    navigator.clipboard.writeText(data.referral.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white">
      {/* ---------------- State 1: no upcoming bookings ---------------- */}
      <StateDivider index={1} label="No upcoming bookings" />
      <div className="px-4 py-6">
        {/* Real tab strip, components-legacy/booking/BookingsList.tsx, static (this
            direction only demonstrates the Upcoming tab's fill). See the emphasis-ok
            note above for why the two inactive tabs are font-medium here. */}
        <div className="flex gap-2 border-b border-s-border mb-6" aria-hidden="true">
          <span className="border-b-2 border-s-ink px-4 py-3 text-sm font-semibold text-s-ink">
            {tBookingsList("upcoming")}
          </span>
          <span className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-s-ink-2">
            {tBookingsList("past")}
          </span>
          <span className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-s-ink-2">
            {tBookingsList("cancelled")}
          </span>
        </div>
        <Enter i={0}>
          <h3 className="font-heading text-[18px] font-semibold text-s-ink mb-1">
            {tBookingsList("noBookings")}
          </h3>
          <p className="text-[14px] text-s-ink-2 mb-4">{tBookingsListUi("emptyUpcoming")}</p>
        </Enter>
        {data.rebookBookings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {data.rebookBookings.map((booking, i) => (
              <Enter key={booking.id} i={i + 1}>
                <BookingCard booking={booking} />
              </Enter>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-s-ink-2">
            No past salon visits yet to suggest a rebooking from.
          </p>
        )}
      </div>

      {/* ---------------- State 2: favorites empty ---------------- */}
      <StateDivider index={2} label="Favorites empty" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Enter i={0}>
          <h3 className="font-heading text-[18px] font-semibold text-s-ink mb-1">
            {tFavorites("title")}
          </h3>
          <p className="text-[14px] text-s-ink-2 mb-4">{tFavorites("lead")}</p>
        </Enter>
        {data.nearbySalons.length > 0 ? (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {data.nearbySalons.map((card, i) => (
              <Enter key={card.salonId} i={i + 1} className="flex-none">
                <SalonCard {...card} />
              </Enter>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-s-ink-2">No active salons to suggest right now.</p>
        )}
      </div>

      {/* ---------------- State 3: no vouchers ---------------- */}
      <StateDivider index={3} label="No vouchers" />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Enter i={0}>
          <h3 className="font-heading text-[18px] font-semibold text-s-ink mb-1">
            {tVouchers("title")}
          </h3>
          <p className="text-[14px] text-s-ink-2">{tVouchers("emptyBoth")}</p>
        </Enter>
        {/* Referral code card, app/[locale]/profile/referral/page.tsx's own JSX, real data.
            The hero card's own explanation (real referral-page copy, kept as a caption
            rather than the h3, see the header REPAIR note on state 3) stays here so the
            mechanism is still shown in the real page's own words. */}
        {data.referral.referralCode && (
          <Enter i={1}>
            <p className="text-[12px] text-s-ink-2">{tReferral("heroSubtitle")}</p>
            <div className="mt-2 bg-white/80 rounded-[12px] border border-s-ink/5 shadow-elevation-1 p-5"> {/* drift-ok: verbatim copy, app/[locale]/profile/referral/page.tsx */}
              <p className="text-xs font-medium text-s-ink-2 mb-2">{tReferral("codeLabel")}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-s-bg-surface border border-s-border rounded-btn px-4 py-3 data-text font-bold text-lg text-s-ink tracking-wider text-center">
                  {data.referral.referralCode}
                </div>
                <button
                  onClick={copyCode}
                  aria-label={tReferral("copyCode")}
                  className="p-3 rounded-btn bg-s-ink text-white hover:brightness-[1.06] transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </Enter>
        )}
        {/* Stats card, same file, real friends_invited / total_earned. Both figures stay
            font-medium here, see the emphasis-ok note above. */}
        <Enter i={2}>
          <div className="bg-white/80 rounded-[12px] border border-s-ink/5 shadow-elevation-1 p-5"> {/* drift-ok: verbatim copy, app/[locale]/profile/referral/page.tsx */}
            <h2 className="font-heading text-sm text-s-ink mb-3">{tReferral("statsTitle")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-s-bg-surface rounded-btn">
                <Users className="w-5 h-5 text-s-ink-2 mx-auto mb-1" />
                <p className="data-text font-medium text-[18px] text-s-ink">{data.referral.friendsInvited}</p>
                <p className="text-xs text-s-ink-2">{tReferral("friendsInvited")}</p>
              </div>
              <div className="text-center p-3 bg-s-bg-surface rounded-btn">
                <Gift className="w-5 h-5 text-s-ink-2 mx-auto mb-1" />
                <p className="data-text font-medium text-[18px] text-s-ink">
                  {formatCurrency(data.referral.totalEarnedCHF, locale)}
                </p>
                <p className="text-xs text-s-ink-2">{tReferral("earned")}</p>
              </div>
            </div>
          </div>
        </Enter>
      </div>

      {/* ---------------- State 4: looks empty ---------------- */}
      <StateDivider index={4} label="Looks empty" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Enter i={0}>
          <h3 className="font-heading text-[18px] font-semibold text-s-ink mb-1">
            {tLooks("title")}
          </h3>
          <p className="text-[14px] text-s-ink-2 mb-4">{tLooks("lead")}</p>
        </Enter>
        {data.looks.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {data.looks.map((look, i) => (
              <Enter key={look.id} i={i + 1}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-s-bg-sunken">
                  {look.displayImage && (
                    <Image
                      src={look.displayImage}
                      alt={look.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  )}
                </div>
                {look.styleName && (
                  <p className="mt-1.5 truncate text-[12px] text-s-ink-2">{look.styleName}</p>
                )}
              </Enter>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-s-ink-2">No published looks to show right now.</p>
        )}
      </div>
    </div>
  );
}
