"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Info } from "lucide-react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Sheet, SheetHeader, SheetBody, SheetCTARow } from "@/app/[locale]/_components/primitives/Sheet";
import { DateTimePicker, type DateTimeValue } from "@/app/[locale]/_components/primitives/DateTimePicker";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import type { Booking } from "./BookingCard";

// Platform rule mirrored from app/api/bookings/[id]/reschedule/route.ts (RESCHEDULE_MIN_LEAD_HOURS).
const RESCHEDULE_MIN_LEAD_HOURS = 24;

interface RawSlot {
  time: string;
  isAvailable: boolean;
}

/**
 * RescheduleSheet. The missing customer-facing UI for POST /api/bookings/[id]/reschedule
 * (backend already existed: zod bookingRescheduleSchema, resolveBookingActor authz, claimSlot,
 * rate-limited, RESCHEDULE_MIN_LEAD_HOURS=24). Built to the mockup at commit b3d99fc67
 * (public/_mockups/confirmation-v2.html, right frame "Move your appointment") , that file lives on
 * branch claude/backend-analysis-improvements-77f02b, NOT on main, so do not expect it in this tree.
 * Owner instruction was "make it and make a fucking slot picker"; treat the mockup as the visual
 * target, not as a recorded sign-off. Reuses the
 * existing DateTimePicker primitive (strip layout) instead of a bespoke date control
 * (V3-D445), and the same availability endpoints DateTimeStep.tsx already calls. Mirrors
 * CancelBookingSheet's sheet shape (Sheet primitive, inline loading/error, guarded close
 * while a request is in flight).
 * mockup-ok: treatment matches the confirmation-v2.html right frame at b3d99fc67 (lead box border-only,
 * no sunken fill; blue accent selection is the locked booking-picker exception).
 */
export default function RescheduleSheet({
  booking,
  isOpen,
  onOpenChange,
  onRescheduled,
}: {
  booking: Booking | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRescheduled: () => void;
}) {
  const t = useTranslations("bookingsList");
  const tDate = useTranslations("booking.dateSelection");
  const tTime = useTranslations("booking.timeSelection");
  const locale = useLocale();

  const [value, setValue] = React.useState<DateTimeValue>({ date: null, time: null });
  const [unavailableDates, setUnavailableDates] = React.useState<Set<string>>(new Set());
  const [slots, setSlots] = React.useState<{ time: string; available: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [slotsError, setSlotsError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset local picker state each time the sheet opens (possibly for a different booking).
  React.useEffect(() => {
    if (!isOpen) return;
    setValue({ date: null, time: null });
    setSlots([]);
    setError(null);
  }, [isOpen, booking?.id]);

  const hoursUntilBooking = booking
    ? (new Date(booking.starts_at).getTime() - Date.now()) / (1000 * 60 * 60)
    : 0;
  const windowPassed = hoursUntilBooking < RESCHEDULE_MIN_LEAD_HOURS;

  const durationMinutes = booking
    ? booking.service?.duration_minutes ??
      Math.round((new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) / (1000 * 60))
    : 0;

  const staffId = booking?.staff?.id ?? "";

  // Fetch unavailable dates for this booking's salon/staff/service (mirrors DateTimeStep.tsx:80).
  React.useEffect(() => {
    if (!isOpen || !booking || windowPassed) return;
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams({
          salon_id: booking.salon_id,
          staff_id: staffId,
          service_ids: booking.service_id,
        });
        const res = await fetch(`/api/availability/unavailable-dates?${params}`);
        if (!res.ok) throw new Error("Failed to fetch unavailable dates");
        const data = await res.json();
        if (alive) setUnavailableDates(new Set(data.unavailableDates || []));
      } catch (err) {
        console.error("[RescheduleSheet] Failed to fetch unavailable dates:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isOpen, booking, windowPassed, staffId]);

  // Fetch time slots when a date is picked (mirrors DateTimeStep.tsx:106).
  React.useEffect(() => {
    if (!isOpen || !booking || !value.date || windowPassed) return;
    let alive = true;
    setIsLoadingSlots(true);
    setSlotsError(null);
    (async () => {
      try {
        const params = new URLSearchParams({
          salon_id: booking.salon_id,
          date: value.date!.toString(),
          staff_id: staffId,
          service_ids: booking.service_id,
          duration_minutes: String(durationMinutes),
        });
        const res = await fetch(`/api/availability/time-slots?${params}`);
        if (!res.ok) throw new Error("Failed to fetch time slots");
        const data = await res.json();
        if (alive) {
          setSlots((data.slots ?? []).map((s: RawSlot) => ({ time: s.time, available: s.isAvailable })));
        }
      } catch (err) {
        console.error("[RescheduleSheet] Failed to fetch time slots:", err);
        if (alive) {
          setSlotsError(tTime("errorFetchingSlots"));
          setSlots([]);
        }
      } finally {
        if (alive) setIsLoadingSlots(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isOpen, booking, value.date, windowPassed, staffId, durationMinutes, tTime]);

  if (!booking) return null;

  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const paidChf = booking.price_paid;

  const targetLabel =
    value.date && value.time
      ? new Intl.DateTimeFormat(localeCode, { weekday: "short", day: "numeric", month: "short" }).format(
          value.date.toDate(getLocalTimeZone())
        )
      : null;

  const confirmReschedule = async () => {
    if (!value.date || !value.time) return;
    setSubmitting(true);
    setError(null);
    try {
      const dateStr = value.date.toString();
      const newStartsAt = new Date(`${dateStr}T${value.time}:00`).toISOString();
      const newEndsAt = new Date(new Date(newStartsAt).getTime() + durationMinutes * 60_000).toISOString();
      const response = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_starts_at: newStartsAt, new_ends_at: newEndsAt }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || `Reschedule failed: ${response.statusText}`);
      }
      onRescheduled();
    } catch (err) {
      console.error("[RescheduleSheet] Failed to reschedule booking:", err);
      setError(err instanceof Error ? err.message : t("rescheduleError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (submitting) return; // guard close while the request is in flight, mirrors CancelBookingSheet's cancelling guard
        onOpenChange(open);
      }}
      height="auto"
      aria-label={t("rescheduleTitle")}
    >
      <SheetHeader title={t("rescheduleTitle")} onClose={() => onOpenChange(false)} closeAriaLabel={t("rescheduleCloseAria")} />
      <SheetBody>
        {windowPassed ? (
          // No point repeating the 24h policy line here, the message below already states it
          // specifically for this booking (copy economy: don't say the same fact twice).
          <p className="rounded-card bg-s-bg-sunken px-[18px] py-4 text-[14px] leading-relaxed text-s-ink-2">
            {t("rescheduleWindowPassed")}
          </p>
        ) : (
          <div className="flex gap-2 rounded-[12px] border border-s-border px-3 py-2.5 text-[12px] leading-relaxed text-s-ink-2">
            <Info size={14} strokeWidth={1.6} className="mt-0.5 shrink-0" aria-hidden />
            <span>{paidChf > 0 ? t("rescheduleLeadPaid", { amount: formatCurrency(paidChf, locale) }) : t("rescheduleLead")}</span>
          </div>
        )}

        {!windowPassed && (
          <div className="mt-5">
            <DateTimePicker
              value={value}
              onChange={setValue}
              dateLayout="strip"
              selectedTone="accent"
              slots={slots}
              isLoadingSlots={isLoadingSlots}
              minDate={today(getLocalTimeZone())}
              isDateDisabled={(d) => unavailableDates.has(d.toString())}
              dateLabel={tDate("pickDate")}
              timeLabel={tTime("title")}
              labels={{
                morning: tTime("morning"),
                afternoon: tTime("afternoon"),
                evening: tTime("evening"),
                availableTimes: tTime("title"),
                moreDates: tDate("pickDate"),
              }}
              emptySlotContent={
                slotsError ? (
                  <p className="py-4 text-center text-sm text-s-ink-2">{slotsError}</p>
                ) : (
                  <p className="py-4 text-center text-sm text-s-ink-2">{tTime("noSlotsAvailable")}</p>
                )
              }
            />
          </div>
        )}

        {error && <p className="mt-4 text-sm text-s-error">{error}</p>}
      </SheetBody>
      <SheetCTARow layout="primary-only">
        <button
          type="button"
          onClick={confirmReschedule}
          disabled={windowPassed || !value.date || !value.time || submitting}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting && <Spinner size="sm" invert />}
          {windowPassed
            ? t("rescheduleWindowPassedCta")
            : targetLabel && value.time
              ? t("rescheduleCta", { date: targetLabel, time: value.time })
              : t("reschedulePickPrompt")}
        </button>
      </SheetCTARow>
    </Sheet>
  );
}
