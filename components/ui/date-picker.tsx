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
}

export default function SolenDatePicker({
  label = "Datum wählen",
  value,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  className,
}: SolenDatePickerProps) {
  return (
    <DatePicker
      value={value}
      onChange={(v) => v && onChange?.(v)}
      minValue={minValue}
      maxValue={maxValue}
      isDateUnavailable={isDateUnavailable}
      className={cn("flex flex-col gap-1", className)}
    >
      <Label className="text-xs font-medium text-dark/60 font-body">{label}</Label>
      <Group className="flex items-center rounded-button border border-gray-200 bg-white px-3 py-2 text-sm focus-within:border-s-coral focus-within:ring-2 focus-within:ring-s-coral/20 transition-all">
        <DateInput className="flex flex-1 items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="rounded px-0.5 tabular-nums data-text text-dark outline-none focus:bg-s-coral/10 focus:text-s-coral placeholder-shown:text-dark/40"
            />
          )}
        </DateInput>
        <Button className="ml-2 p-1 rounded hover:bg-gray-100 transition-colors">
          <CalendarIcon className="w-4 h-4 text-dark/40" />
        </Button>
      </Group>
      <Popover
        className="rounded-card border border-gray-100 bg-white shadow-glass p-3 z-50"
      >
        <Dialog className="outline-none">
          <Calendar>
            <header className="flex items-center justify-between mb-2">
              <Button
                slot="previous"
                className="p-1.5 rounded-button hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-dark/60" />
              </Button>
              <Heading className="text-sm font-heading font-semibold text-dark" />
              <Button
                slot="next"
                className="p-1.5 rounded-button hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-dark/60" />
              </Button>
            </header>
            <CalendarGrid className="w-full">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-[10px] font-medium text-dark/40 pb-2 w-9 text-center">
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
                        "w-9 h-9 flex items-center justify-center rounded-button text-sm data-text transition-colors cursor-pointer outline-none",
                        isSelected && "bg-s-coral text-white font-semibold",
                        !isSelected && !isDisabled && !isUnavailable && "hover:bg-s-coral/10 text-dark",
                        isUnavailable && "text-dark/20 bg-gray-100 cursor-default line-through",
                        isDisabled && !isUnavailable && "text-dark/20 cursor-default",
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
  );
}
