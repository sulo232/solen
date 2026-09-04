"use client";

// exists-check: net-new vs app/api/availability/time-slots/route.ts (the real slot-source API,
// whose exact query is replicated server-side in page.tsx, not duplicated here) and
// app/[locale]/_components/primitives/Select.tsx (unrelated primitive, no client wrapper for
// DateTimePicker existed anywhere). This file is the one net-new piece: a client component
// holding the two comparison states (current vs proposed radius) for this decision mockup.
//
// Grounded-in: app/[locale]/_components/primitives/DateTimePicker.tsx (real, unmodified import
// used for the "Current" block) + components-legacy/booking/DateTimeStep.tsx (the real booking
// step this props shape mirrors: dateLayout="strip", selectedTone="accent").
// Depicts: real booking day-strip + time-slot grid -> app/[locale]/_components/primitives/DateTimePicker.tsx,
//   fed with the exact real slots this page's server component queried for one real salon+day.

import * as React from "react";
import { useTranslations } from "next-intl";
import { parseDate, today, getLocalTimeZone, type CalendarDate } from "@internationalized/date";
import { DateTimePicker, type TimeSlot } from "@/app/[locale]/_components/primitives/DateTimePicker";
import { ProposedTimeSlotBlock } from "./ProposedTimeSlotBlock";

export function SlotRadiusClient({
  initialDateISO,
  slots,
  defaultSelectedTime,
}: {
  initialDateISO: string;
  slots: TimeSlot[];
  defaultSelectedTime: string;
}) {
  const tDate = useTranslations("booking.dateSelection");
  const tTime = useTranslations("booking.timeSelection");
  const tz = getLocalTimeZone();
  const initialDate = React.useMemo(() => parseDate(initialDateISO), [initialDateISO]);

  const [currentValue, setCurrentValue] = React.useState<{ date: CalendarDate | null; time: string | null }>({
    date: initialDate,
    time: defaultSelectedTime,
  });
  const [proposedValue, setProposedValue] = React.useState<{ date: CalendarDate | null; time: string | null }>({
    date: initialDate,
    time: defaultSelectedTime,
  });

  const labels = {
    morning: tTime("morning"),
    afternoon: tTime("afternoon"),
    evening: tTime("evening"),
    availableTimes: tTime("title"),
    pickDay: tDate("selectDate"),
    pickDayHint: tDate("subtitle"),
    noSlots: tTime("noSlotsAvailable"),
    noSlotsHint: tTime("noSlotsAvailable"),
    moreDates: tDate("pickDate"),
  };

  return (
    <div className="mx-auto w-full max-w-[402px] bg-white px-4 pt-6 pb-16">
      <div className="mb-6">
        <p className="text-[13px] font-semibold text-s-ink">Current: rounded-full pill</p>
        <p className="mt-0.5 text-[12px] text-s-ink-2">Real, unmodified DateTimePicker component</p>
        <div className="mt-3">
          <DateTimePicker
            value={currentValue}
            onChange={setCurrentValue}
            dateLayout="strip"
            selectedTone="accent"
            slots={slots}
            minDate={today(tz)}
            dateLabel={tDate("title")}
            timeLabel={tTime("title")}
            labels={labels}
          />
        </div>
      </div>

      <div className="my-8 h-px bg-s-border" />

      <div>
        <p className="text-[13px] font-semibold text-s-ink">Proposed: 16px radius</p>
        <p className="mt-0.5 text-[12px] text-s-ink-2">Same real slots, CLAUDE.md button/chip radius lock (16px) on the slot buttons only</p>
        <div className="mt-3">
          <ProposedTimeSlotBlock
            value={proposedValue}
            onChange={setProposedValue}
            minDate={today(tz)}
            stripDays={14}
            slots={slots}
            labels={labels}
            dateLabel={tDate("title")}
            timeLabel={tTime("title")}
          />
        </div>
      </div>
    </div>
  );
}
