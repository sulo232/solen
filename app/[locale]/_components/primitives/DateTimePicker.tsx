"use client";

import * as React from "react";
import {
  Calendar as AriaCalendar,
  RangeCalendar as AriaRangeCalendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarCell,
  Heading,
  Button,
  I18nProvider,
  type DateValue,
  type RangeValue,
} from "react-aria-components";
import { today, getLocalTimeZone, parseTime, type CalendarDate } from "@internationalized/date";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Sheet, SheetHeader, SheetBody } from "./Sheet";

/**
 * V3 Date / time picker — LIVE_TRUTH §F.5.
 *
 * Architecture (V2-D28): `react-aria-components` Calendar wrapped with V3 styling. Uses
 * `@internationalized/date` for date math (already in deps via react-aria). Native
 * `<input type="date" />` is banned per §F.5.7 — too inconsistent across iOS / Android / desktop.
 *
 * Composition:
 *   <DateTimePicker
 *     value={{ date, time }}
 *     onChange={({ date, time }) => ...}
 *     slots={fetchedSlots}             // async-fetched availability
 *     isLoadingSlots={loading}
 *     isDateDisabled={(d) => salonClosedDays.includes(d.toString())}
 *   />
 *
 * v1 ships single-date + date-and-time. `DateTimePickerRange` (ig6, 2026-07-16) adds the
 * range variant: two adjacent months, a shaded span, blue endpoints, a result pill.
 */

export type TimeSlot = {
  /** ISO time string e.g. "14:30" or full ISO datetime — caller defines format. */
  time: string;
  available: boolean;
  /** Optional reason shown on hover when unavailable (e.g. "bereits gebucht"). */
  unavailableReason?: string;
};

export type DateTimeValue = {
  date: CalendarDate | null;
  /** The `time` string from the selected slot. Null if no slot selected yet. */
  time: string | null;
};

/**
 * Localized copy for the shared picker. The primitive ships German defaults
 * (its first consumers were de-only); i18n'd callers (the booking flow, de/en/fr/it)
 * pass their next-intl strings so one component speaks the caller's locale.
 */
export type DateTimeLabels = {
  morning: string;
  afternoon: string;
  evening: string;
  /** Heading above the slot list when no group labels apply. */
  availableTimes: string;
  /** Empty state — no date chosen yet. */
  pickDay: string;
  pickDayHint: string;
  /** Empty state — date chosen but zero slots. */
  noSlots: string;
  noSlotsHint: string;
  /** Strip layout: the "see further dates" affordance + its sheet title. */
  moreDates: string;
};

const DEFAULT_LABELS: DateTimeLabels = {
  morning: "Vormittag",
  afternoon: "Nachmittag",
  evening: "Abend",
  availableTimes: "Verfügbare Zeiten",
  pickDay: "Wähle einen Tag",
  pickDayHint: "Verfügbare Zeiten erscheinen hier.",
  noSlots: "Keine freien Termine",
  noSlotsHint: "Wähle einen anderen Tag oder einen anderen Salon.",
  moreDates: "Weitere Daten",
};

export interface DateTimePickerProps {
  /** Controlled value: date + time. Time is null when no slot picked. */
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  /** Available time slots for the currently selected date. */
  slots?: TimeSlot[];
  /** Show skeleton shimmer for the time slot list. */
  isLoadingSlots?: boolean;
  /** Earliest selectable date. Default `today()` in caller's local timezone. */
  minDate?: CalendarDate;
  /** Latest selectable date. Optional. */
  maxDate?: CalendarDate;
  /** Custom disabled-date predicate — e.g. salon-closed days. */
  isDateDisabled?: (date: CalendarDate) => boolean;
  /**
   * `date-and-time` (default) — calendar + time slot list side-by-side / stacked.
   * `single-date` — calendar only, no time slots.
   */
  variant?: "date-and-time" | "single-date";
  /**
   * Selected-day fill. `ink` (default) for the booking flow; `accent` (royal blue,
   * the s-accent token) for the search overlay date screen, per the approved mockup
   * `solen-search-council.html`: "blue fill only marks your date/time pick".
   */
  selectedTone?: "ink" | "accent";
  /**
   * Date-axis layout. `calendar` (default) = always-on month grid (search / single-date).
   * `strip` = horizontal scroll of the next `stripDays` days + a "more dates" pill that
   * opens the month grid in a sheet — the booking flow's fast near-term picker.
   */
  dateLayout?: "calendar" | "strip";
  /** Strip length in days (`dateLayout="strip"` only). Default 14. */
  stripDays?: number;
  /** Localized copy. Defaults to German; pass your next-intl strings for other locales. */
  labels?: Partial<DateTimeLabels>;
  /** Override the "no slots" empty state (e.g. booking's waitlist CTA). */
  emptySlotContent?: React.ReactNode;
  /** Optional heading above the date picker (strip layout), e.g. "Datum wählen". */
  dateLabel?: string;
  /** Optional heading above the time slots (strip layout), e.g. "Zeit wählen". */
  timeLabel?: string;
  className?: string;
}

/* ================================================================================
   Top-level DateTimePicker (composes Calendar + TimeSlotList)
   ================================================================================ */

export function DateTimePicker({
  value,
  onChange,
  slots,
  isLoadingSlots = false,
  minDate,
  maxDate,
  isDateDisabled,
  variant = "date-and-time",
  selectedTone = "ink",
  dateLayout = "calendar",
  stripDays = 14,
  labels,
  emptySlotContent,
  dateLabel,
  timeLabel,
  className,
}: DateTimePickerProps) {
  const tz = getLocalTimeZone();
  const minDateResolved = minDate ?? today(tz);
  const L = React.useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const [moreOpen, setMoreOpen] = React.useState(false);

  // Reset the picked time whenever the date changes — slots are date-specific.
  const handleDateChange = (date: DateValue | null | undefined) =>
    onChange({
      date: (date ?? null) as CalendarDate | null,
      time:
        value.date && date && value.date.toString() === date.toString()
          ? value.time
          : null,
    });

  const timeColumn = variant === "date-and-time" && (
    <TimeSlotList
      slots={slots}
      value={value.time}
      onChange={(time) => onChange({ ...value, time })}
      isLoading={isLoadingSlots}
      isDateSelected={value.date !== null}
      selectedTone={selectedTone}
      labels={L}
      emptySlotContent={emptySlotContent}
    />
  );

  // ── Strip layout (booking): day-strip on top, slots below, full month grid in a sheet ──
  if (dateLayout === "strip") {
    return (
      <div className={cn("flex flex-col gap-7", className)}>
        <div>
          {dateLabel && <SectionHeading>{dateLabel}</SectionHeading>}
          <DayStrip
            value={value.date ?? null}
            onChange={handleDateChange}
            minDate={minDateResolved}
            maxDate={maxDate}
            isDateDisabled={isDateDisabled}
            stripDays={stripDays}
            selectedTone={selectedTone}
            moreLabel={L.moreDates}
            onMoreDates={() => setMoreOpen(true)}
          />
        </div>
        {variant === "date-and-time" && (
          <div>
            {timeLabel && value.date && <SectionHeading>{timeLabel}</SectionHeading>}
            {timeColumn}
          </div>
        )}
        <Sheet isOpen={moreOpen} onOpenChange={setMoreOpen} height="auto">
          <SheetHeader title={L.moreDates} onClose={() => setMoreOpen(false)} />
          <SheetBody>
            <SolenCalendar
              value={value.date ?? undefined}
              onChange={(date) => {
                handleDateChange(date);
                setMoreOpen(false);
              }}
              minValue={minDateResolved}
              maxValue={maxDate}
              isDateUnavailable={isDateDisabled}
              selectedTone={selectedTone}
              fullWidth
            />
          </SheetBody>
        </Sheet>
      </div>
    );
  }

  // ── Calendar layout (search / single-date): month grid beside slot column (unchanged) ──
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-start",
        className,
      )}
    >
      <SolenCalendar
        value={value.date ?? undefined}
        onChange={handleDateChange}
        minValue={minDateResolved}
        maxValue={maxDate}
        isDateUnavailable={isDateDisabled}
        selectedTone={selectedTone}
        fullWidth={variant === "single-date"}
      />
      {timeColumn}
    </div>
  );
}

/* ================================================================================
   SectionHeading — optional date/time headings for the strip layout (booking)
   ================================================================================ */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-heading text-lg font-bold text-s-ink mb-3">{children}</h3>;
}

/* ================================================================================
   DayStrip — horizontal next-N-days picker (booking's fast near-term layout)
   ================================================================================ */

interface DayStripProps {
  value: CalendarDate | null;
  onChange: (date: CalendarDate) => void;
  minDate: CalendarDate;
  maxDate?: CalendarDate;
  isDateDisabled?: (date: CalendarDate) => boolean;
  stripDays: number;
  selectedTone: "ink" | "accent";
  moreLabel: string;
  onMoreDates: () => void;
}

function DayStrip({
  value,
  onChange,
  minDate,
  maxDate,
  isDateDisabled,
  stripDays,
  selectedTone,
  moreLabel,
  onMoreDates,
}: DayStripProps) {
  const locale = useLocale();
  const tz = getLocalTimeZone();
  const dl = locale === "en" ? "en-US" : locale;
  const days = React.useMemo(
    () => Array.from({ length: stripDays }, (_, i) => minDate.add({ days: i })),
    [minDate, stripDays],
  );
  // CalendarDate → localized "Mo" / "Mai" (strip trailing CLDR period to match the calendar)
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
              "shrink-0 w-[72px] rounded-2xl border py-3 flex flex-col items-center gap-0.5",
              "transition-[colors,transform] duration-150 ease-snap active:scale-[0.98] active:duration-[80ms] active:ease-glide",
              selected
                ? selectedTone === "accent"
                  ? "bg-s-accent border-s-accent text-white"
                  : "bg-s-ink border-s-ink text-white"
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
      {/* trailing "more dates" pill → opens the month grid in a sheet */}
      <button
        type="button"
        onClick={onMoreDates}
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

/* ================================================================================
   Calendar — wraps react-aria-components Calendar with V3 styling
   ================================================================================ */

interface SolenCalendarProps {
  value?: DateValue;
  onChange?: (date: DateValue) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  isDateUnavailable?: (date: CalendarDate) => boolean;
  selectedTone?: "ink" | "accent";
  /** Fill the container width (standalone single-date layout) vs fixed 320px (beside time-slot column). */
  fullWidth?: boolean;
}

function SolenCalendar({ value, onChange, minValue, maxValue, isDateUnavailable, selectedTone = "ink", fullWidth = false }: SolenCalendarProps) {
  // Locale drives weekday labels (de → "Mo Di Mi …"); firstDayOfWeek forces the
  // Swiss Monday-first week regardless of locale region. Without the I18nProvider
  // react-aria defaults to en-US ("S M T W T F S", Sunday-first) — wrong for CH.
  const locale = useLocale();
  return (
    <I18nProvider locale={locale}>
    <AriaCalendar
      value={value}
      onChange={onChange}
      minValue={minValue}
      maxValue={maxValue}
      firstDayOfWeek="mon"
      isDateUnavailable={isDateUnavailable as ((date: DateValue) => boolean) | undefined}
      className={cn(
        "bg-s-bg-base border border-s-border rounded-[12px] p-4",
        fullWidth ? "w-full" : "w-[320px] md:w-[300px]",
      )}
    >
      <header className="flex items-center justify-between mb-3 px-1">
        <Heading
          slot="title"
          className="font-body font-semibold text-[16px] leading-none text-s-ink"
        />
        <div className="flex gap-1">
          <Button
            slot="previous"
            aria-label="Voriger Monat"
            className={cn(
              "flex items-center justify-center w-9 h-9",
              "bg-transparent border-0 text-s-ink-2 cursor-pointer",
              "rounded-md transition-[colors,transform] duration-150 ease-snap active:scale-[0.94] active:duration-[80ms] active:ease-glide",
              "hover:text-s-ink hover:bg-s-bg-sunken",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              "data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed",
            )}
          >
            <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </Button>
          <Button
            slot="next"
            aria-label="Nächster Monat"
            className={cn(
              "flex items-center justify-center w-9 h-9",
              "bg-transparent border-0 text-s-ink-2 cursor-pointer",
              "rounded-md transition-[colors,transform] duration-150 ease-snap active:scale-[0.94] active:duration-[80ms] active:ease-glide",
              "hover:text-s-ink hover:bg-s-bg-sunken",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              "data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed",
            )}
          >
            <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </Button>
        </div>
      </header>

      {/* weekdayStyle="short" → "Mo Di Mi Do Fr Sa So" (council); narrow default is ambiguous "M D M D F S S" */}
      <CalendarGrid weekdayStyle="short" className="w-full border-collapse">
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell
              className={cn(
                "text-center font-body font-semibold text-[12px]",
                "text-s-ink-2",
                "py-1.5",
              )}
            >
              {/* strip CLDR trailing period (some locales render "Mo.") to match council "Mo" */}
              {typeof day === "string" ? day.replace(/\.$/, "") : day}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className={cn(
                // base cell — TD wrapping
                "p-[1px]",
              )}
            >
              {({
                isSelected,
                isDisabled,
                isUnavailable,
                isOutsideMonth,
                isFocusVisible,
                formattedDate,
              }) => (
                <span
                  className={cn(
                    // fixed 40px circle CENTERED in the full-width column — council density.
                    // (aspect-square would size each day to the full column = 46px airy squares.)
                    "mx-auto flex h-10 w-10 items-center justify-center",
                    "font-body font-normal text-[14px]",
                    "rounded-full cursor-pointer select-none",
                    "tabular-nums",
                    "transition-[background,color] duration-150 ease-snap",
                    // default
                    "text-s-ink",
                    // hover
                    !isDisabled && !isUnavailable && "hover:bg-s-bg-sunken",
                    // selected — ink (booking default) or royal-blue accent (search, per council mockup)
                    isSelected &&
                      (selectedTone === "accent"
                        ? "bg-s-accent text-white font-semibold hover:bg-s-accent"
                        : "bg-s-ink text-white font-semibold hover:bg-s-ink"),
                    // disabled / unavailable (past dates, salon closed)
                    (isDisabled || isUnavailable) &&
                      "opacity-30 cursor-not-allowed text-s-ink-2 hover:bg-transparent",
                    // outside current month (prev/next month days)
                    isOutsideMonth && !isSelected && "opacity-40 text-s-ink-2",
                    // focus ring
                    isFocusVisible &&
                      "outline-2 outline outline-s-ink outline-offset-2",
                  )}
                >
                  {formattedDate}
                </span>
              )}
            </CalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </AriaCalendar>
    </I18nProvider>
  );
}

/* ================================================================================
   TimeSlotList — async-fetched availability, grouped by day-period
   ================================================================================ */

interface TimeSlotListProps {
  slots?: TimeSlot[];
  value: string | null;
  onChange: (time: string | null) => void;
  isLoading?: boolean;
  isDateSelected: boolean;
  labels: DateTimeLabels;
  emptySlotContent?: React.ReactNode;
  /** Selected-slot fill: `ink` (default) or `accent` (blue) — match the day-strip tone. */
  selectedTone?: "ink" | "accent";
}

function TimeSlotList({ slots, value, onChange, isLoading, isDateSelected, labels, emptySlotContent, selectedTone = "ink" }: TimeSlotListProps) {
  // Group slots by period
  const groups = React.useMemo(() => groupByPeriod(slots ?? [], labels), [slots, labels]);

  // Pre-render skeleton state
  if (isLoading) {
    return (
      <div className="flex-1 min-w-[240px] max-w-[360px] bg-s-bg-base border border-s-border rounded-[12px] p-4">
        <div className="font-body font-semibold text-[12.5px] text-s-ink-2 mb-2">
          {labels.availableTimes}
        </div>
        <div className="slot-cascade grid grid-cols-4 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-full py-2.5 h-[38px]",
                "bg-gradient-to-r from-s-bg-sunken via-s-ink/[0.08] to-s-bg-sunken",
                "bg-[length:200%_100%] animate-shimmer",
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state — no date or no slots
  if (!isDateSelected || (slots && slots.length === 0)) {
    // Caller-supplied empty content (e.g. booking's waitlist CTA) wins once a date is chosen.
    if (isDateSelected && emptySlotContent) return <>{emptySlotContent}</>;
    return (
      <div className="flex-1 min-w-[240px] max-w-[360px] bg-s-bg-base border border-s-border rounded-[12px] p-4">
        <div className="text-center py-8 px-4">
          <CalIcon className="w-12 h-12 mx-auto mb-3 text-s-ink-disabled opacity-50" strokeWidth={2} />
          <div className="font-semibold text-s-ink text-[15px] mb-1.5">
            {isDateSelected ? labels.noSlots : labels.pickDay}
          </div>
          <div className="text-[14px] text-s-ink-2">
            {isDateSelected ? labels.noSlotsHint : labels.pickDayHint}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Verfügbare Zeiten"
      className="flex-1 min-w-[240px] max-w-[360px] bg-s-bg-base border border-s-border rounded-[12px] p-4"
    >
      {groups.map((group) => (
        <div key={group.label} className="mb-4 last:mb-0">
          <div className="font-body font-semibold text-[12.5px] text-s-ink-2 mb-2">
            {group.label}
          </div>
          <div className="slot-cascade grid grid-cols-4 gap-1.5">
            {group.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                role="option"
                aria-selected={value === slot.time}
                aria-label={`${slot.time} Uhr ${slot.available ? "verfügbar" : "nicht verfügbar"}`}
                disabled={!slot.available}
                onClick={() => onChange(slot.time)}
                className={cn(
                  "px-3.5 py-2.5 rounded-full",
                  "font-body font-semibold text-[14px]",
                  "border transition-[colors,transform] duration-150 ease-snap active:scale-[0.98] active:duration-[80ms] active:ease-glide",
                  "tabular-nums cursor-pointer",
                  "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                  value === slot.time
                    ? (selectedTone === "accent"
                        ? "bg-s-accent text-white border-s-accent hover:bg-s-accent"
                        : "bg-s-ink text-white border-s-ink hover:bg-s-ink")
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

/* ================================================================================
   Helpers
   ================================================================================ */

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
      // Fallback: parse "HH:mm" manually
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

/* ================================================================================
   DateTimePickerRange: the range variant reserved by DateTimePicker.md (ig6, 2026-07-16)
   ================================================================================ */

export type DateRangeValue = {
  start: CalendarDate | null;
  end: CalendarDate | null;
};

export type DateRangeLabels = {
  /** Connector word in the result pill, e.g. "bis" (de) / "to" (en) / "au" (fr) / "al" (it). */
  to: string;
};

const DEFAULT_RANGE_LABELS: DateRangeLabels = { to: "bis" };

// mockup-ok: ig6, owner-approved TASTE_LOG.md 2026-07-16 "IG-principles round 1". Nav buttons
// reuse SolenCalendar's own chrome (chevrons, hover) unchanged; no focus-visible outline added
// per the standing no-focus-ring policy (globals.css line 360).
const RANGE_NAV_BTN = cn(
  "flex items-center justify-center w-9 h-9",
  "bg-transparent border-0 text-s-ink-2 cursor-pointer",
  "rounded-md transition-[colors,transform] duration-150 ease-snap active:scale-[0.94] active:duration-[80ms] active:ease-glide",
  "hover:text-s-ink hover:bg-s-bg-sunken",
  "data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed",
);

export interface DateTimePickerRangeProps {
  /** Controlled value: start + end. Either can be null until a full range is picked. */
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Earliest selectable date. Default `today()` in caller's local timezone. */
  minDate?: CalendarDate;
  /** Latest selectable date. Optional. */
  maxDate?: CalendarDate;
  /** Custom disabled-date predicate. */
  isDateDisabled?: (date: CalendarDate) => boolean;
  /** Localized copy. Defaults to German, pass your next-intl strings for other locales. */
  labels?: Partial<DateRangeLabels>;
  className?: string;
}

/**
 * Range picker: two adjacent months (stacked on mobile), the selected span shaded
 * (`bg-s-accent/10`), endpoints filled in the locked booking-blue (`s-accent`), and a
 * result pill below reading e.g. "28. Jul bis 5. Aug". Vacation blocks, or any other
 * start/end date span. Don't fork a second range picker, extend this one.
 */
export function DateTimePickerRange({
  value,
  onChange,
  minDate,
  maxDate,
  isDateDisabled,
  labels,
  className,
}: DateTimePickerRangeProps) {
  const locale = useLocale();
  const tz = getLocalTimeZone();
  const minDateResolved = minDate ?? today(tz);
  const L = React.useMemo(() => ({ ...DEFAULT_RANGE_LABELS, ...labels }), [labels]);
  const dl = locale === "en" ? "en-US" : locale;

  const rangeValue: RangeValue<CalendarDate> | null =
    value.start && value.end ? { start: value.start, end: value.end } : null;

  // Day + month, no year. Matches the existing repo-wide pattern (RewardsView.tsx,
  // NotificationsClient.tsx, DetailPage.tsx and others all format the same way).
  const fmtDay = (d: CalendarDate) => d.toDate(tz).toLocaleDateString(dl, { day: "numeric", month: "short" });

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <I18nProvider locale={locale}>
        <AriaRangeCalendar
          value={rangeValue}
          onChange={(range) =>
            onChange({
              start: (range?.start as CalendarDate | undefined) ?? null,
              end: (range?.end as CalendarDate | undefined) ?? null,
            })
          }
          minValue={minDateResolved}
          maxValue={maxDate}
          firstDayOfWeek="mon"
          visibleDuration={{ months: 2 }}
          isDateUnavailable={isDateDisabled as ((date: DateValue) => boolean) | undefined}
          className="bg-s-bg-base border border-s-border rounded-[12px] p-4"
        >
          {({ state }) => (
            <>
              <header className="flex items-center justify-between mb-3 px-1">
                <Button slot="previous" aria-label="Voriger Monat" className={RANGE_NAV_BTN}>
                  <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </Button>
                <Button slot="next" aria-label="Nächster Monat" className={RANGE_NAV_BTN}>
                  <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </Button>
              </header>
              <div className="flex flex-col md:flex-row gap-6 md:gap-4">
                <RangeMonthGrid monthStart={state.visibleRange.start} monthOffset={0} dl={dl} tz={tz} />
                <RangeMonthGrid
                  monthStart={state.visibleRange.start.add({ months: 1 })}
                  monthOffset={1}
                  dl={dl}
                  tz={tz}
                />
              </div>
            </>
          )}
        </AriaRangeCalendar>
      </I18nProvider>

      {value.start && value.end && (
        <div className="self-start rounded-pill border border-s-border bg-s-bg-sunken px-4 py-2 text-[14px] font-medium text-s-ink tabular-nums">
          {fmtDay(value.start)} {L.to} {fmtDay(value.end)}
        </div>
      )}
    </div>
  );
}

interface RangeMonthGridProps {
  monthStart: CalendarDate;
  monthOffset: number;
  dl: string;
  tz: string;
}

function RangeMonthGrid({ monthStart, monthOffset, dl, tz }: RangeMonthGridProps) {
  const monthLabel = monthStart.toDate(tz).toLocaleDateString(dl, { month: "long", year: "numeric" });
  return (
    <div className="flex-1">
      <div className="mb-2 px-1 font-body font-semibold text-[14px] text-s-ink capitalize">{monthLabel}</div>
      <CalendarGrid offset={{ months: monthOffset }} weekdayStyle="short" className="w-full border-collapse">
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className="text-center font-body font-semibold text-[12px] text-s-ink-2 py-1.5">
              {typeof day === "string" ? day.replace(/\.$/, "") : day}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className={(renderProps) =>
                cn(
                  "p-[1px]",
                  renderProps.isSelected && "bg-s-accent/10",
                  renderProps.isSelected && renderProps.isSelectionStart && "rounded-l-full",
                  renderProps.isSelected && renderProps.isSelectionEnd && "rounded-r-full",
                )
              }
            >
              {({
                isOutsideMonth,
                isSelectionStart,
                isSelectionEnd,
                isDisabled,
                isUnavailable,
                formattedDate,
              }) =>
                isOutsideMonth ? null : (
                  <span
                    className={cn(
                      "mx-auto flex h-10 w-10 items-center justify-center",
                      "font-body font-normal text-[14px]",
                      "rounded-full cursor-pointer select-none tabular-nums",
                      "transition-[background,color] duration-150 ease-snap",
                      "text-s-ink",
                      !isDisabled && !isUnavailable && "hover:bg-s-bg-sunken",
                      (isSelectionStart || isSelectionEnd) &&
                        "bg-s-accent text-white font-semibold hover:bg-s-accent",
                      (isDisabled || isUnavailable) &&
                        "opacity-30 cursor-not-allowed text-s-ink-2 hover:bg-transparent",
                    )}
                  >
                    {formattedDate}
                  </span>
                )
              }
            </CalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  );
}
