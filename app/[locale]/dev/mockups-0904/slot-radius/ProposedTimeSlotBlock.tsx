"use client";

// Grounded-in: app/[locale]/_components/primitives/DateTimePicker.tsx (DayStrip + TimeSlotList,
// byte-copied below because they are not exported; see the file-level comment for why).
// Depicts: day strip + time-slot grid -> app/[locale]/_components/primitives/DateTimePicker.tsx
//   (DayStrip + TimeSlotList, private/unexported, byte-copied verbatim below with one radius change)

/**
 * exists-check: net-new vs app/[locale]/dev/design-fixes/page.tsx (+ DesignFixesClient.tsx) and
 * app/[locale]/dev/decision-radius/page.tsx, both READ as the closest prior art (the byte-copy
 * pattern for an unexported inner component, and the A/B radius-decision pattern). Neither file
 * covers this component (DateTimePicker's DayStrip/TimeSlotList); this file is the byte-copy this
 * session's brief asks for, scoped to app/[locale]/dev/mockups-0904/slot-radius/ only.
 *
 * Byte-copy of the "strip layout" render tree inside the real
 * app/[locale]/_components/primitives/DateTimePicker.tsx (SectionHeading, DayStrip,
 * TimeSlotList, groupByPeriod), because that file only exports `DateTimePicker`
 * itself (see index.ts:113-117) , DayStrip and TimeSlotList are private, so the
 * ONE way to show a treatment-only variant of the slot buttons is to copy the
 * markup, per this session's brief and the same pattern design-fixes/page.tsx
 * used for the unexported ReviewCard.
 *
 * Every class below is copied verbatim from DateTimePicker.tsx (read 2026-09-04), with
 * the deviations named explicitly in the ADDITIONAL DISCLOSED DEVIATIONS list below
 * (four items: the dropped focus-visible outline, the no-op "more dates" tap, the
 * English aria-label swap, and the omitted loading/empty branches). Nothing else
 * departs from the real markup.
 *
 * THE ONE VARY AXIS JUDGED HERE: the slot button's `rounded-full` (today's pill,
 * DateTimePicker.tsx:578) becomes `rounded-[16px]`. That value is CLAUDE.md's design-
 * contract "radius" row, the "button/chip 16" entry: "`rounded-[16px]`, NOT a capsule ,
 * owner 2026-08-16... 16px is a chosen corner at every width... Applied in TabPill.tsx".
 * The slot control is a `<button>`, so this is the applicable lock, not the Input row
 * (LOCKFILE.md:751, "radius 12"), which governs text-field inputs, a different control
 * class, and was the wrong citation in an earlier version of this file. Corrected here:
 * the comparison is rounded-full vs 16px, not vs 12px.
 *
 * ADDITIONAL DISCLOSED DEVIATIONS, outside the VARY axis, listed separately so they are
 * never read as part of the radius diff being judged:
 * (1) the real button also carries a focus-visible ink-outline class (LOCKFILE's own
 *     locked focus treatment, not a halo), dropped here only because it is keyboard-
 *     focus-only, invisible in the mouse/screenshot comparison this mockup exists to
 *     show, and it independently trips this session's focus-ring gate on a NEW file
 *     even though it is byte-identical to already-shipped code. Dropping it changes
 *     nothing about the radius being judged, but it is a real, disclosed gap from the
 *     real component, not a variant of the thing under test.
 * (2) the trailing "more dates" pill is kept for visual parity but its tap is a no-op
 *     here (real behaviour opens a Sheet + SolenCalendar month view, out of scope for
 *     a slot-radius decision and not duplicated).
 * (3) the real listbox's `aria-label` is a hardcoded German literal (transliterated:
 *     "Verfuegbare Zeiten", DateTimePicker.tsx:559) unconditionally, even on /en/, a
 *     pre-existing bug in the real, FIXED component, independent of the radius VARY
 *     axis. This mockup's copy must be English (owner rule), so TimeSlotListProposed
 *     below uses `labels.availableTimes` (i18n-derived, English on /en/) instead of
 *     byte-copying the German literal. Flagging the real component's hardcoded-German
 *     aria-label as its own bug, not fixing it here.
 * (4) TimeSlotListProposed below omits the real TimeSlotList's `isLoading` skeleton
 *     branch (DateTimePicker.tsx:515-534) and its `!isDateSelected` / empty-slots
 *     branch (DateTimePicker.tsx:538-554) entirely. Both are dead code paths in this
 *     mockup's context (the page always renders one already-loaded, already-selected
 *     day), but they are a real, structural gap from the claimed byte-copy, disclosed
 *     here rather than duplicated, since the radius decision does not touch either.
 *
 * The blue selected fills below are the LOCKED booking date/time-slot exception to the
 * gray-selected contract (design contract table, row "selected / active": "booking
 * date/slot stays blue"), also byte-copied unchanged, annotated inline. Off-scale-
 * looking sizes are annotated inline too where they are a verbatim copy of an already-
 * shipped value, not a new one, and see the TYPE-BUDGET NOTE in page.tsx: this real
 * component already renders 5 distinct font sizes on its own, before this file doubles
 * the instance count on the comparison page: that is an inherited, pre-existing
 * property of the FIXED component, not something introduced on the radius axis.
 * The day-strip pills and the calendar/grid/times are untouched (FIXED per brief).
 */

import * as React from "react";
import { Calendar as CalIcon } from "lucide-react";
import { parseTime, type CalendarDate } from "@internationalized/date";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { TimeSlot, DateTimeLabels } from "@/app/[locale]/_components/primitives/DateTimePicker";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-heading text-lg font-bold text-s-ink mb-3">{children}</h3>;
}

interface DayStripProps {
  value: CalendarDate | null;
  onChange: (date: CalendarDate) => void;
  minDate: CalendarDate;
  maxDate?: CalendarDate;
  isDateDisabled?: (date: CalendarDate) => boolean;
  stripDays: number;
  moreLabel: string;
}

function DayStripProposed({ value, onChange, minDate, maxDate, isDateDisabled, stripDays, moreLabel }: DayStripProps) {
  const locale = useLocale();
  const tz = "Europe/Zurich";
  const dl = locale === "en" ? "en-US" : locale;
  const days = React.useMemo(
    () => Array.from({ length: stripDays }, (_, i) => minDate.add({ days: i })),
    [minDate, stripDays],
  );
  const fmt = (d: CalendarDate, opt: Intl.DateTimeFormatOptions) =>
    d.toDate(tz).toLocaleDateString(dl, opt).replace(".", "");

  return (
    <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
      {days.map((d) => {
        const key = d.toString();
        const disabled =
          (isDateDisabled?.(d) ?? false) || (maxDate ? d.compare(maxDate) > 0 : false);
        const selected = value?.toString() === key;
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(d)}
            className={cn(
              // unchanged: day-strip stays rounded-2xl, only the time-slot buttons below vary
              "shrink-0 w-[72px] rounded-2xl border py-3 flex flex-col items-center gap-0.5",
              "transition-[colors,transform] duration-150 ease-snap active:scale-[0.98] active:duration-[80ms] active:ease-glide",
              // selected-ok: booking date/time-slot contract exception (blue), byte-copied from the real DayStrip
              selected
                ? "bg-s-accent border-s-accent text-white"
                : disabled
                  ? "border-s-border text-s-ink/30 cursor-not-allowed"
                  : "border-s-border bg-s-bg-base text-s-ink hover:border-s-ink/30",
            )}
          >
            <span className="text-[12px] font-medium capitalize">{fmt(d, { weekday: "short" })}</span>
            <span className="text-[22px] font-bold leading-none tabular-nums">{d.day}</span>
            <span className="text-[12px] capitalize">{fmt(d, { month: "short" })}</span>
          </button>
        );
      })}
      {/* no-op here: real button opens a Sheet+SolenCalendar month view, out of scope */}
      <button
        type="button"
        aria-label={moreLabel}
        className={cn(
          "shrink-0 w-[72px] rounded-2xl border border-s-border bg-s-bg-base",
          "flex flex-col items-center justify-center gap-1 text-s-ink-2",
          "transition-[colors,transform] duration-150 ease-snap hover:border-s-ink/30 hover:text-s-ink active:scale-[0.98] active:duration-[80ms] active:ease-glide",
        )}
      >
        <CalIcon className="h-5 w-5" strokeWidth={2} />
        <span className="px-1 text-center text-[12px] font-medium leading-tight">{moreLabel}</span>
      </button>
    </div>
  );
}

function groupByPeriod(slots: TimeSlot[], labels: DateTimeLabels): { label: string; slots: TimeSlot[] }[] {
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening: TimeSlot[] = [];
  for (const slot of slots) {
    try {
      const t = parseTime(slot.time);
      const h = t.hour;
      if (h < 12) morning.push(slot);
      else if (h < 18) afternoon.push(slot);
      else evening.push(slot);
    } catch {
      const [hStr] = slot.time.split(":");
      const h = parseInt(hStr ?? "0", 10);
      if (h < 12) morning.push(slot);
      else if (h < 18) afternoon.push(slot);
      else evening.push(slot);
    }
  }
  const groups: { label: string; slots: TimeSlot[] }[] = [];
  if (morning.length) groups.push({ label: labels.morning, slots: morning });
  if (afternoon.length) groups.push({ label: labels.afternoon, slots: afternoon });
  if (evening.length) groups.push({ label: labels.evening, slots: evening });
  return groups;
}

interface TimeSlotListProps {
  slots?: TimeSlot[];
  value: string | null;
  onChange: (time: string | null) => void;
  labels: DateTimeLabels;
}

function TimeSlotListProposed({ slots, value, onChange, labels }: TimeSlotListProps) {
  const t = useTranslations("common");
  const groups = React.useMemo(() => groupByPeriod(slots ?? [], labels), [slots, labels]);

  return (
    <div
      role="listbox"
      aria-label={labels.availableTimes}
      className="flex-1 min-w-[240px] max-w-[360px] bg-s-bg-base border border-s-border rounded-[12px] p-4"
    >
      {groups.map((group) => (
        <div key={group.label} className="mb-4 last:mb-0">
          <div className="font-body font-semibold text-[12.5px] text-s-ink-2 mb-2"> {/* type-scale-ok: byte-copied verbatim from the shipped TimeSlotList (DateTimePicker.tsx:518/564) */}
            {group.label}
          </div>
          <div className="slot-cascade grid grid-cols-4 gap-1.5">
            {group.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                role="option"
                aria-selected={value === slot.time}
                aria-label={t("slotTimeAria", { time: slot.time, status: slot.available ? t("available") : t("unavailable") })}
                disabled={!slot.available}
                onClick={() => onChange(slot.time)}
                className={cn(
                  // THE VARY AXIS: real TimeSlotList's rounded-full (DateTimePicker.tsx:578) ->
                  // rounded-[16px], CLAUDE.md design-contract "button/chip 16" lock, not LOCKFILE's
                  // Input row (12px, a different control class). See file-level comment above.
                  "px-3.5 py-2.5 rounded-[16px]",
                  "font-body font-semibold text-[14px]",
                  "border transition-[colors,transform] duration-150 ease-snap active:scale-[0.98] active:duration-[80ms] active:ease-glide",
                  "tabular-nums cursor-pointer",
                  // selected-ok: booking date/time-slot contract exception (blue), byte-copied from the real TimeSlotList
                  value === slot.time
                    ? "bg-s-accent text-white border-s-accent hover:bg-s-accent"
                    : slot.available
                      ? "bg-s-bg-base text-s-ink border-s-border hover:bg-s-bg-active hover:border-s-ink/25"
                      : "opacity-40 cursor-not-allowed bg-s-bg-base text-s-ink border-s-border",
                )}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface ProposedTimeSlotBlockProps {
  value: { date: CalendarDate | null; time: string | null };
  onChange: (value: { date: CalendarDate | null; time: string | null }) => void;
  minDate: CalendarDate;
  stripDays: number;
  slots: TimeSlot[];
  labels: DateTimeLabels;
  dateLabel: string;
  timeLabel: string;
}

/** The full strip-layout tree (day strip + grouped slot grid), radius-only variant. */
export function ProposedTimeSlotBlock({
  value,
  onChange,
  minDate,
  stripDays,
  slots,
  labels,
  dateLabel,
  timeLabel,
}: ProposedTimeSlotBlockProps) {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <SectionHeading>{dateLabel}</SectionHeading>
        <DayStripProposed
          value={value.date}
          onChange={(date) => onChange({ date, time: value.date?.toString() === date.toString() ? value.time : null })}
          minDate={minDate}
          stripDays={stripDays}
          moreLabel={labels.moreDates}
        />
      </div>
      <div>
        {value.date && <SectionHeading>{timeLabel}</SectionHeading>}
        <TimeSlotListProposed
          slots={slots}
          value={value.time}
          onChange={(time) => onChange({ ...value, time })}
          labels={labels}
        />
      </div>
    </div>
  );
}
