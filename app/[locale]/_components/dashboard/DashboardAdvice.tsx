"use client";

// registry-sync-ok: registered this turn in _design-system/COMPONENT_REGISTRY.md (Dashboard
// section, row "DashboardAdvicePanel") with the component doc at
// _design-system/components/DashboardAdvice.md.
//
// mockup-ok: nothing here is a new visual idea. The panel is the locked DashPanel; the row is
// the hairline-divided `px-5 py-4 border-b border-s-border last:border-b-0` block DashRow
// already ships on this same screen, and the action link is DashPanel's own header-link
// recipe verbatim (13px, ink, ArrowRight 15). Sizes 15/13/12 are all already on the dashboard
// home. The FEATURE was approved by name (owner decision 9, 2026-08-09 "9 a"); the rendered
// look still owes him a preview before it counts as signed off.
//
// exists-check: net-new vs DashboardUI.tsx (reuses its DashPanel rather than adding a
// primitive) and vs components-legacy/dashboard/ActivityFeed.tsx (that lists events that
// happened; this states patterns across weeks and what to do about them). `npm run exists
// advice` and `npm run exists insight` both returned 0 matches.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DashPanel } from "./DashboardUI";
import type { AdviceDaypart, AdviceItem, DashboardAdvice } from "@/lib/dashboard-advice";

// ─────────────────────────────────────────────────────────────
// Dashboard advice panel: the one place on the home screen that says what to DO,
// not what the numbers are.
//
// Every line it renders is computed from this salon's own bookings in
// lib/dashboard-advice.ts. When the history is too thin, or the opening hours
// that say which slots are even workable are missing, the panel states that with
// the real counts instead of inventing an insight. There is no placeholder tip
// and no benchmark against other salons: we do not have one.
// ─────────────────────────────────────────────────────────────

// 2026-01-04 is a Sunday, so anchor + dayIndex lands on the right weekday for a
// getDay() index. Read in UTC because the anchor carries no meaningful time.
const WEEKDAY_ANCHOR = Date.UTC(2026, 0, 4);

function weekdayName(locale: string, day: number): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" })
    .format(new Date(WEEKDAY_ANCHOR + day * 86400000));
}

// `as const` so the values stay literal message keys, which is what useTranslations types
// against; a plain Record<AdviceDaypart, string> widens them and stops type-checking.
const SLOT_KEY = {
  morning: "adviceSlotMorning",
  afternoon: "adviceSlotAfternoon",
  evening: "adviceSlotEvening",
} as const satisfies Record<AdviceDaypart, string>;

function AdviceRow({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="px-5 py-4 border-b border-s-border last:border-b-0">
      <p className="text-[15px] font-semibold tracking-[-0.005em] text-s-ink">{title}</p>
      <p className="text-[13px] text-s-ink-2 mt-1">{body}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 mt-2.5 text-[13px] font-medium text-s-ink hover:text-s-ink-2 transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide"
        >
          {actionLabel}
          <ArrowRight size={15} strokeWidth={1.9} />
        </Link>
      )}
    </div>
  );
}

export default function DashboardAdvicePanel({ advice }: { advice: DashboardAdvice }) {
  const locale = useLocale();
  const t = useTranslations("dashboard.homePage");
  const settings = `/${locale}/dashboard/settings`;

  const slotLabel = (item: Extract<AdviceItem, { daypart: AdviceDaypart }>) =>
    t(SLOT_KEY[item.daypart], { day: weekdayName(locale, item.day) });

  const rows: React.ReactNode[] = advice.items.map((item, i) => {
    switch (item.kind) {
      case "empty_slot":
        return (
          <AdviceRow
            key={i}
            title={t("adviceEmptyTitle", { slot: slotLabel(item) })}
            body={t("adviceEmptyBody", { average: item.average })}
            actionLabel={t("adviceActionOffpeak")}
            actionHref={`${settings}?tab=offpeak`}
          />
        );
      case "quiet_slot":
        return (
          <AdviceRow
            key={i}
            title={t("adviceQuietTitle", { slot: slotLabel(item) })}
            body={t("adviceQuietBody", { count: item.count, average: item.average })}
            actionLabel={t("adviceActionOffpeak")}
            actionHref={`${settings}?tab=offpeak`}
          />
        );
      case "busy_slot":
        return (
          <AdviceRow
            key={i}
            title={t("adviceBusyTitle", { slot: slotLabel(item) })}
            body={t("adviceBusyBody", { count: item.count, average: item.average })}
            actionLabel={t("adviceActionStaff")}
            actionHref={`/${locale}/dashboard/staff`}
          />
        );
      case "cancellations":
        return (
          <AdviceRow
            key={i}
            title={t("adviceCancelTitle", { percent: item.percent })}
            body={t("adviceCancelBody", { count: item.count, total: item.total })}
            actionLabel={t("adviceActionCancellation")}
            actionHref={`${settings}?tab=cancellation`}
          />
        );
    }
  });

  // Nothing cleared the evidence bar. Say WHICH of the three reasons it is, with the
  // real number, rather than showing a tip we cannot stand behind.
  if (rows.length === 0) {
    if (advice.counted_bookings < advice.min_bookings) {
      rows.push(
        <AdviceRow
          key="not-enough"
          title={t("adviceNotEnoughTitle")}
          body={t("adviceNotEnoughBody", { count: advice.counted_bookings, min: advice.min_bookings })}
        />,
      );
    } else if (!advice.has_opening_hours) {
      rows.push(
        <AdviceRow
          key="no-hours"
          title={t("adviceNoHoursTitle")}
          body={t("adviceNoHoursBody")}
          actionLabel={t("adviceActionHours")}
          actionHref={`${settings}?tab=profile`}
        />,
      );
    } else {
      rows.push(
        <AdviceRow
          key="nothing"
          title={t("adviceNothingTitle")}
          body={t("adviceNothingBody", { count: advice.counted_bookings })}
        />,
      );
    }
  }

  return (
    <DashPanel title={t("adviceTitle")}>
      {rows}
      <p className="px-5 py-3 text-[12px] text-s-ink-2">
        {t("adviceWindow", { weeks: advice.window_weeks })}
      </p>
    </DashPanel>
  );
}
