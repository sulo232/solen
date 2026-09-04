// Grounded-in: app/[locale]/dashboard/bookings/page.tsx:248-262 (the "All / Confirmed / Completed /
// Cancelled / No-show" filter pill row); components-legacy/dashboard/DashboardLayout.tsx (chrome).
//
// Exists-check: `npm run exists "filter pill"` this turn returned the treatment already applied
// (light-blue selected) in 11 dashboard files, incl. app/[locale]/dashboard/bookings/page.tsx:248-262
// (its own comment there reads "Filters - light-blue active (approved skin)") and
// app/[locale]/dashboard/staff/page.tsx:641 (identical classes). `npm run exists
// "dashboard-filter-pill-gray"` returned 0 matches (net-new mockup route). No REMOVED.md hit for
// filter pills. The one new thing here: the gray-selected TabPill treatment shown ON the real
// bookings filter row, side by side with today's blue, so the change can be approved before the
// className swap ships to the 11 real files.
//
// Depicts: dashboard chrome -> components-legacy/dashboard/DashboardLayout.tsx (real, unmodified import)
//
// The filter row itself is inline JSX inside BookingsPage's default export (not a separately
// exported component, same situation app/[locale]/dev/design-fixes/page.tsx documents for its
// review-card pair), so it cannot be imported directly. CurrentFilterRow below is a byte-copy of
// app/[locale]/dashboard/bookings/page.tsx:248-262 (same wrapper classes, same conditional branch,
// same STATUS_LABEL_KEYS map, same t("dashboard.bookingsPage") translation calls, so the labels are
// the real English strings from messages/en.json, not invented copy). ProposedFilterRow is the same
// byte-copy with only the selected-branch className changed to the locked TabPill recipe
// (bg-s-bg-sunken + text-s-ink + semibold, see app/[locale]/_components/primitives/TabPill.tsx's
// "outline"+"active" compound variant: `border-s-bg-sunken bg-s-bg-sunken text-s-ink`). The
// unselected branch is untouched in both (already "white + hairline": bg-white border-s-border
// text-s-ink-2), because unselected is not part of this VARY.
//
// Mockup-scope: section
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import type { BookingStatus } from "@/lib/types";

// Same map as app/[locale]/dashboard/bookings/page.tsx:23-30 (real i18n keys, real namespace).
const STATUS_LABEL_KEYS = {
  pending: "statusPending",
  pending_approval: "statusPendingApproval",
  confirmed: "statusConfirmed",
  cancelled: "statusCancelled",
  completed: "statusCompleted",
  no_show: "statusNoShow",
} as const satisfies Record<BookingStatus, string>;

const FILTERS = ["all", "confirmed", "completed", "cancelled", "no_show"] as const;

// Byte-copy of the real row (bookings/page.tsx:248-262). Selected = today's light-blue, kept here
// ONLY as the "Current" (before) comparison for the Proposed gray row below; not a new proposal.
function CurrentFilterRow() {
  const t = useTranslations("dashboard.bookingsPage");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {FILTERS.map((s) => (
        <button
          key={s}
          onClick={() => setStatusFilter(s)}
          className={[
            "px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors border",
            // selected-ok: "Current" (before) comparison row, byte-copy of the live blue in bookings/page.tsx:257, shown only to compare against the gray Proposed row below.
            statusFilter === s
              ? "bg-s-accent-bright/10 text-s-accent-bright border-transparent"
              : "bg-white border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink",
          ].join(" ")}
        >
          {s === "all" ? t("filterAll") : t(STATUS_LABEL_KEYS[s])}
        </button>
      ))}
    </div>
  );
}

// Same byte-copy. Only the selected branch changes, to the locked TabPill recipe.
function ProposedFilterRow() {
  const t = useTranslations("dashboard.bookingsPage");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {FILTERS.map((s) => (
        <button
          key={s}
          onClick={() => setStatusFilter(s)}
          className={[
            "px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors border",
            statusFilter === s
              ? "border-s-bg-sunken bg-s-bg-sunken text-s-ink"
              : "bg-white border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink",
          ].join(" ")}
        >
          {s === "all" ? t("filterAll") : t(STATUS_LABEL_KEYS[s])}
        </button>
      ))}
    </div>
  );
}

export default function DashboardFilterPillGrayMockup() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-[437px]">
        <div>
          <p className="text-[13px] font-semibold text-s-ink-2 mb-4">Current: light-blue selected</p>
          <CurrentFilterRow />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-s-ink-2 mb-4">Proposed: gray selected (locked TabPill treatment)</p>
          <ProposedFilterRow />
        </div>
      </div>
    </DashboardLayout>
  );
}
