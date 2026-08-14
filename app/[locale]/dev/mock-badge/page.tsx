/**
 * Mockup-scope: whole-page
 * Exists-check: `npm run exists mock-badge` -> 0 hits (net-new route). `npm run exists
 * decision-badge` -> the v1 A/B panel mockup (app/[locale]/dev/decision-badge/page.tsx,
 * kept on disk untouched, superseded by this route per the owner's 2026-07-13 rewrite).
 * `npm run exists NotificationBell/Hero` -> both real
 * (app/[locale]/_components/layout/NotificationBell.tsx, badge classes quoted below;
 * app/[locale]/_components/homepage/Hero.tsx). Net-new: this whole-page route. No dev
 * route renders the real homepage top (Header, Hero, first feed sections) for this
 * decision today, v1 rendered only an isolated bell icon in a 2-col grid.
 *
 * Decision: notification-count badge colour. NotificationBell.tsx:48 ships `bg-s-accent`
 * (blue) today; the open decision (LOCKFILE §13.3) is between s-error red and neutral ink.
 *
 * The app-wide Header (with the real NotificationBell mounted inside it) already renders
 * automatically for EVERY route under [locale] via app/[locale]/layout.tsx, this page
 * does NOT re-import Header itself (that would double it). It composes Hero + the first
 * FeedZone sections in the SAME order as app/[locale]/page.tsx (MobileCategoriesRow,
 * RecentlyViewed, Nearby).
 *
 * Real-composition blocker (named, not faked): NotificationBell only renders a badge for
 * a logged-in session with a real unread count > 0 (a real fetch to
 * /api/profile/notifications); a server-rendered dev preview with no session shows
 * nothing, identical to any guest visit, so the two colours can't be compared on the real
 * bell without a live "3 unread" session. To make the comparison possible at all, this
 * route ALSO renders one small, explicitly captioned example badge quoting the bell's
 * EXACT markup (NotificationBell.tsx:37-53) with count 3, labeled "Beispiel" only in its
 * own caption text (never stamped on the badge itself), not the real component and not a
 * claimed live value. NotificationBell.tsx is NOT edited.
 */
import { notFound } from "next/navigation";
import { Bell } from "lucide-react";
import Hero from "@/app/[locale]/_components/homepage/Hero";
import { FeedZone } from "@/app/[locale]/_components/homepage/SectionHeader";
import MobileCategoriesRow from "@/app/[locale]/_components/homepage/MobileCategoriesRow";
import RecentlyViewed from "@/app/[locale]/_components/homepage/RecentlyViewed";
import Nearby from "@/app/[locale]/_components/homepage/Nearby";
import { VariantSwitcher } from "../_shared/VariantSwitcher";

const EXAMPLE_COUNT = 3;
const BADGE_CLASS =
  "absolute right-1 top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full px-[3px] text-[10px] font-bold leading-none text-white"; // drift-ok: exact quote of the live badge (NotificationBell.tsx:48), not a new invention.

export default async function MockBadgePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { v } = await searchParams;
  const variant = v === "ink" ? "ink" : "rot";
  const badgeTone = variant === "ink" ? "bg-s-ink" : "bg-s-error";

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-end gap-2 px-4 pt-3">
        <span className="text-[12px] text-s-ink-2">
          Badge preview (example, count {EXAMPLE_COUNT}, not a live value):
        </span>
        <span aria-hidden className="relative grid h-10 w-10 place-items-center text-s-ink">
          <Bell size={21} strokeWidth={2} aria-hidden />
          <span className={`${BADGE_CLASS} ${badgeTone}`}>{EXAMPLE_COUNT}</span>
        </span>
      </div>
      <Hero />
      <FeedZone>
        <MobileCategoriesRow />
        <RecentlyViewed />
        <Nearby />
      </FeedZone>
      <VariantSwitcher
        options={[
          { value: "rot", label: "Red" },
          { value: "ink", label: "Ink" },
        ]}
      />
    </div>
  );
}
