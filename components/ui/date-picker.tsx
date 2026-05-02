"use client";

import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
} from "react-aria-components";
import { I18nProvider } from "react-aria";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateValue } from "react-aria-components";

interface SolenDatePickerProps {
  label?: string;
  value?: DateValue | null;
  onChange?: (date: DateValue) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  isDateUnavailable?: (date: DateValue) => boolean;
  className?: string;
  /** BCP 47 locale string — defaults to "de-CH" (Swiss German, dd.mm.yyyy) */
  locale?: string;
  /** Render the calendar inline (no popover trigger) */
  inline?: boolean;
}

export default function SolenDatePicker({
  label = "Datum wählen",
  value,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  className,
  locale = "de-CH",
  inline,
}: SolenDatePickerProps) {
  if (inline) {
    return (
      <I18nProvider locale={locale ?? "de-CH"}>
        <Calendar
          value={value ?? undefined}
          onChange={(v) => v && onChange?.(v)}
          minValue={minValue}
          maxValue={maxValue}
          isDateUnavailable={isDateUnavailable}
          className={cn("w-full p-3", className)}
        >
          <header className="flex items-center justify-between mb-2">
            <Button
              slot="previous"
              className="p-1.5 rounded-btn hover:bg-s-bg-sunken transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-s-ink/60" />
            </Button>
            <Heading className="text-sm font-heading font-semibold text-s-ink" />
            <Button
              slot="next"
              className="p-1.5 rounded-btn hover:bg-s-bg-sunken transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-s-ink/60" />
            </Button>
          </header>
          <CalendarGrid className="w-full">
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="text-[10px] font-medium text-s-ink/40 pb-2 w-11 text-center">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  className={({ isSelected, isDisabled, isUnavailable, isFocusVisible }) =>
                    cn(
                      "w-11 h-11 flex items-center justify-center rounded-btn text-sm data-text transition-colors cursor-pointer outline-none",
                      isSelected && "bg-s-coral text-white font-semibold",
                      !isSelected && !isDisabled && !isUnavailable && "hover:bg-s-coral/10 text-s-ink",
                      isUnavailable && "text-s-ink/20 bg-s-bg-sunken cursor-default line-through",
                      isDisabled && !isUnavailable && "text-s-ink/20 cursor-default",
                      isFocusVisible && "ring-2 ring-s-coral ring-offset-1"
                    )
                  }
                />
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>
      </I18nProvider>
    );
  }

  return (
    <I18nProvider locale={locale}>
    <DatePicker
      value={value}
      onChange={(v) => v && onChange?.(v)}
      minValue={minValue}
      maxValue={maxValue}
      isDateUnavailable={isDateUnavailable}
      className={cn("flex flex-col gap-1", className)}
    >
      <Label className="text-xs font-medium text-s-ink/60 font-body">{label}</Label>
      <Group className="flex items-center rounded-btn border border-s-ink/10 bg-white px-3 py-2 text-sm focus-within:border-s-coral focus-within:ring-2 focus-within:ring-s-coral/20 transition-[border-color,box-shadow]">
        <DateInput className="flex flex-1 items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded px-0.5 tabular-nums data-text text-s-ink outline-none focus:bg-s-coral/10 focus:text-s-coral placeholder-shown:text-s-ink/40"
            />
          )}
        </DateInput>
        <Button className="ml-2 p-1 rounded hover:bg-s-bg-sunken transition-colors">
          <CalendarIcon className="w-4 h-4 text-s-ink/40" />
        </Button>
      </Group>
      <Popover
        className="rounded-[12px] border border-s-ink/5 bg-white shadow-surface p-3 z-50"
      >
        <Dialog className="outline-none">
          <Calendar>
            <header className="flex items-center justify-between mb-2">
              <Button
                slot="previous"
                className="p-1.5 rounded-btn hover:bg-s-bg-sunken transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-s-ink/60" />
              </Button>
              <Heading className="text-sm font-heading font-semibold text-s-ink" />
              <Button
                slot="next"
                className="p-1.5 rounded-btn hover:bg-s-bg-sunken transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-s-ink/60" />
              </Button>
            </header>
            <CalendarGrid className="w-full">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-[10px] font-medium text-s-ink/40 pb-2 w-11 text-center">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={({ isSelected, isDisabled, isUnavailable, isFocusVisible }) =>
                      cn(
                        "w-11 h-11 flex items-center justify-center rounded-btn text-sm data-text transition-colors cursor-pointer outline-none",
                        isSelected && "bg-s-coral text-white font-semibold",
                        !isSelected && !isDisabled && !isUnavailable && "hover:bg-s-coral/10 text-s-ink",
                        isUnavailable && "text-s-ink/20 bg-s-bg-sunken cursor-default line-through",
                        isDisabled && !isUnavailable && "text-s-ink/20 cursor-default",
                        isFocusVisible && "ring-2 ring-s-coral ring-offset-1"
                      )
                    }
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
    </I18nProvider>
  );
}
