"use client";

import * as React from "react";
import {
  Calendar as AriaCalendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarCell,
  Heading,
  Button,
  type DateValue,
} from "react-aria-components";
import { today, getLocalTimeZone, parseTime, type CalendarDate } from "@internationalized/date";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * v1 ships single-date + date-and-time. Range picker (vacation blocks) defers to v2.
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
  className,
}: DateTimePickerProps) {
  const tz = getLocalTimeZone();
  const minDateResolved = minDate ?? today(tz);

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-start",
        className,
      )}
    >
      <SolenCalendar
        value={value.date ?? undefined}
        onChange={(date) =>
          onChange({
            date: date as CalendarDate,
            // Reset time when date changes — slots are date-specific
            time: value.date && date && value.date.toString() === date.toString() ? value.time : null,
          })
        }
        minValue={minDateResolved}
        maxValue={maxDate}
        isDateUnavailable={isDateDisabled}
      />

      {variant === "date-and-time" && (
        <TimeSlotList
          slots={slots}
          value={value.time}
          onChange={(time) => onChange({ ...value, time })}
          isLoading={isLoadingSlots}
          isDateSelected={value.date !== null}
        />
      )}
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
}

function SolenCalendar({ value, onChange, minValue, maxValue, isDateUnavailable }: SolenCalendarProps) {
  return (
    <AriaCalendar
      value={value}
      onChange={onChange}
      minValue={minValue}
      maxValue={maxValue}
      isDateUnavailable={isDateUnavailable as ((date: DateValue) => boolean) | undefined}
      className={cn(
        "bg-s-bg-base border border-s-ink/[0.06] rounded-[12px] p-4",
        "w-[320px] md:w-[300px]",
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
              "rounded-md transition-colors duration-150 ease-snap",
              "hover:text-s-ink hover:bg-s-bg-sunken",
              "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
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
              "rounded-md transition-colors duration-150 ease-snap",
              "hover:text-s-ink hover:bg-s-bg-sunken",
              "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
              "data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed",
            )}
          >
            <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </Button>
        </div>
      </header>

      <CalendarGrid className="w-full border-collapse">
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell
              className={cn(
                "text-center font-body font-semibold text-[11px]",
                "tracking-[0.08em] uppercase text-s-ink-3",
                "py-1.5",
              )}
            >
              {day}
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
                    "flex items-center justify-center aspect-square",
                    "font-body font-normal text-[14px]",
                    "rounded-full cursor-pointer select-none",
                    "tabular-nums",
                    "transition-[background,color] duration-150 ease-snap",
                    // default
                    "text-s-ink",
                    // hover
                    !isDisabled && !isUnavailable && "hover:bg-s-ink/[0.04]",
                    // selected
                    isSelected && "bg-s-brand text-white font-semibold hover:bg-s-brand",
                    // disabled / unavailable (past dates, salon closed)
                    (isDisabled || isUnavailable) &&
                      "opacity-30 cursor-not-allowed text-s-ink-3 hover:bg-transparent",
                    // outside current month (prev/next month days)
                    isOutsideMonth && !isSelected && "opacity-40 text-s-ink-3",
                    // focus ring
                    isFocusVisible &&
                      "outline-2 outline outline-s-brand outline-offset-2",
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
}

function TimeSlotList({ slots, value, onChange, isLoading, isDateSelected }: TimeSlotListProps) {
  // Group slots by period
  const groups = React.useMemo(() => groupByPeriod(slots ?? []), [slots]);

  // Pre-render skeleton state
  if (isLoading) {
    return (
      <div className="flex-1 min-w-[240px] max-w-[360px] bg-s-bg-base border border-s-ink/[0.06] rounded-[12px] p-4">
        <div className="font-body font-semibold text-[12px] uppercase tracking-[0.08em] text-s-ink-3 mb-2">
          Verfügbare Zeiten
        </div>
        <div className="grid grid-cols-4 gap-1.5">
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
    return (
      <div className="flex-1 min-w-[240px] max-w-[360px] bg-s-bg-base border border-s-ink/[0.06] rounded-[12px] p-4">
        <div className="text-center py-8 px-4">
          <CalIcon className="w-12 h-12 mx-auto mb-3 text-s-ink-disabled opacity-50" strokeWidth={2} />
          <div className="font-semibold text-s-ink text-[15px] mb-1.5">
            {isDateSelected ? "Keine freien Termine" : "Wähle einen Tag"}
          </div>
          <div className="text-[14px] text-s-ink-3">
            {isDateSelected
              ? "Wähle einen anderen Tag oder einen anderen Salon."
              : "Verfügbare Zeiten erscheinen hier."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Verfügbare Zeiten"
      className="flex-1 min-w-[240px] max-w-[360px] bg-s-bg-base border border-s-ink/[0.06] rounded-[12px] p-4"
    >
      {groups.map((group) => (
        <div key={group.label} className="mb-4 last:mb-0">
          <div className="font-body font-semibold text-[12px] uppercase tracking-[0.08em] text-s-ink-3 mb-2">
            {group.label}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
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
                  "border transition-colors duration-150 ease-snap",
                  "tabular-nums cursor-pointer",
                  "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
                  value === slot.time
                    ? "bg-s-brand text-white border-s-brand hover:bg-s-brand"
                    : slot.available
                      ? "bg-s-bg-base text-s-ink border-s-ink/10 hover:bg-s-bg-active hover:border-s-ink/25"
                      : "opacity-40 cursor-not-allowed bg-s-bg-base text-s-ink border-s-ink/10",
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

function groupByPeriod(slots: TimeSlot[]): { label: string; slots: TimeSlot[] }[] {
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
  if (morning.length) groups.push({ label: "Vormittag", slots: morning });
  if (afternoon.length) groups.push({ label: "Nachmittag", slots: afternoon });
  if (evening.length) groups.push({ label: "Abend", slots: evening });
  return groups;
}
