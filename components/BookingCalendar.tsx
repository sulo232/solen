"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { RotateCcw, Info } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import SolenDatePicker from "@/components/ui/date-picker";
import { today as ariaToday, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import type { AvailabilitySlot, RecurringFrequency, StaffMember } from "@/lib/types";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface SlotWithRelations extends AvailabilitySlot {
  services?: { id: string; name_de: string; name_en: string; duration_minutes: number; price: number } | null;
  staff_members?: Pick<StaffMember, "id" | "name" | "avatar_url"> | null;
}

export interface BookingCalendarProps {
  salonId: string;
  serviceId?: string;
  staffMemberId?: string;
  slotId?: string;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getTimeGroup(iso: string): "morning" | "afternoon" | "evening" {
  const h = new Date(iso).getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const GROUP_LABELS = { morning: "Morgens", afternoon: "Nachmittags", evening: "Abends" };

const FREQ_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "weekly", label: "Wöchentlich" },
  { value: "biweekly", label: "Zweiwöchentlich" },
  { value: "monthly", label: "Monatlich" },
];

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function BookingCalendar({ salonId, serviceId, staffMemberId, slotId }: BookingCalendarProps) {
  const locale = useLocale();
  const router = useRouter();

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(todayDate);

  // Convert between JS Date and react-aria DateValue
  const toCalendarDate = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const fromCalendarDate = (d: DateValue) => new Date(d.year, d.month - 1, d.day);
  const ariaMinDate = ariaToday(getLocalTimeZone());
  const ariaMaxDate = toCalendarDate(addDays(todayDate, 30));
  const [slots, setSlots] = useState<SlotWithRelations[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithRelations | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>(staffMemberId ?? "any");
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>("biweekly");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>["channel"]> | null>(null);

  // Fetch staff list once
  useEffect(() => {
    fetch(`/api/salons/${salonId}`)
      .then((r) => r.json())
      .then((d) => {
        setStaffList(d.staff ?? []);
      })
      .catch(() => {});
  }, [salonId]);

  // Fetch profile for first-visit default
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.is_first_visit_default != null) setIsFirstVisit(d.is_first_visit_default); })
      .catch(() => {});
  }, []);

  // Fetch slots
  const fetchSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const params = new URLSearchParams({ salon_id: salonId, date: isoDate(date) });
      if (serviceId) params.set("service_id", serviceId);
      if (selectedStaff !== "any") params.set("staff_member_id", selectedStaff);
      const data = await fetch(`/api/slots?${params}`).then((r) => r.json());
      const items: SlotWithRelations[] = data.items ?? [];
      setSlots(items);
      if (slotId) {
        const pre = items.find((s) => s.id === slotId);
        if (pre) setSelectedSlot(pre);
      }
    } finally {
      setLoadingSlots(false);
    }
  }, [salonId, serviceId, selectedStaff, slotId]);

  useEffect(() => { fetchSlots(selectedDate); }, [selectedDate, fetchSlots]);

  // Realtime — update slot statuses live
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`booking-cal-${salonId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "availability_slots", filter: `salon_id=eq.${salonId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const updated = payload.new as { id: string; status: string };
          setSlots((prev) =>
            prev.map((s) => s.id === updated.id ? { ...s, status: updated.status as AvailabilitySlot["status"] } : s)
          );
          if (selectedSlot?.id === updated.id && updated.status === "booked") {
            setSelectedSlot(null);
            setError("Dieser Slot wurde soeben gebucht. Bitte wähle einen anderen.");
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [salonId, selectedSlot?.id]);

  const availableSlots = slots.filter((s) => s.status === "available");
  const grouped = {
    morning: availableSlots.filter((s) => getTimeGroup(s.starts_at) === "morning"),
    afternoon: availableSlots.filter((s) => getTimeGroup(s.starts_at) === "afternoon"),
    evening: availableSlots.filter((s) => getTimeGroup(s.starts_at) === "evening"),
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    const { data: { user } } = await createBrowserSupabaseClient().auth.getUser();
    if (!user) {
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const endpoint = recurring ? "/api/bookings/recurring" : "/api/bookings";
      const body: Record<string, unknown> = {
        slot_id: selectedSlot.id,
        service_id: serviceId ?? selectedSlot.service_id,
        staff_member_id: selectedStaff !== "any" ? selectedStaff : selectedSlot.staff_member_id,
        is_first_visit: isFirstVisit,
      };
      if (recurring) body.frequency = recurringFreq;
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).message ?? "Fehler");
      setConfirmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Buchung fehlgeschlagen");
    } finally {
      setConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <div className="rounded-card border border-teal/20 bg-teal/5 p-8 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">🎉</span>
        <p className="font-heading font-bold text-xl text-dark">Buchung bestätigt!</p>
        <p className="text-sm text-dark/60">Du erhältst eine Bestätigungs-E-Mail.</p>
        <a href={`/${locale}/profile`} className="mt-2 px-6 py-2.5 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors">
          Meine Buchungen
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-gray-100 bg-white overflow-hidden">
      {/* Staff picker */}
      {staffList.length > 0 && (
        <div className="px-4 pt-4">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm text-dark bg-white outline-none focus:border-teal transition-colors"
          >
            <option value="any">Egal (wer verfügbar ist)</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date picker */}
      <div className="px-4 py-4">
        <SolenDatePicker
          label="Datum wählen"
          value={toCalendarDate(selectedDate)}
          onChange={(d) => setSelectedDate(fromCalendarDate(d))}
          minValue={ariaMinDate}
          maxValue={ariaMaxDate}
        />
      </div>

      {/* Time slots */}
      <div className="px-4 pb-4 min-h-[140px]">
        {loadingSlots ? (
          <div className="flex justify-center py-10"><Spinner size="md" /></div>
        ) : availableSlots.length === 0 ? (
          <p className="text-center text-sm text-dark/40 py-10">Keine freien Slots an diesem Tag.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {(["morning", "afternoon", "evening"] as const).map((group) => {
              const groupSlots = grouped[group];
              if (!groupSlots.length) return null;
              return (
                <div key={group}>
                  <p className="text-xs font-medium text-dark/40 uppercase tracking-wide mb-2">{GROUP_LABELS[group]}</p>
                  <div className="flex flex-wrap gap-2">
                    {groupSlots.map((slot) => {
                      const timeStr = new Date(slot.starts_at).toLocaleTimeString(
                        locale === "de" ? "de-CH" : "en-GB",
                        { hour: "2-digit", minute: "2-digit" }
                      );
                      const isSelected = selectedSlot?.id === slot.id;
                      const discount = slot.price_override && slot.services?.price
                        ? Math.round((1 - slot.price_override / slot.services.price) * 100)
                        : 0;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(isSelected ? null : slot)}
                          className={[
                            "px-3 py-1.5 rounded-button text-sm font-data font-medium transition-all duration-150",
                            isSelected
                              ? "bg-teal text-white shadow-card"
                              : "bg-gray-100 text-dark hover:bg-teal/10 hover:text-teal",
                          ].join(" ")}
                        >
                          {timeStr}
                          {discount > 0 && (
                            <span className="ml-1.5 text-[10px] text-coral">-{discount}%</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary strip — shown after slot selected */}
      {selectedSlot && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 flex flex-col gap-3">
          {/* First-visit */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFirstVisit}
              onChange={(e) => setIsFirstVisit(e.target.checked)}
              className="w-4 h-4 rounded accent-teal"
            />
            <span className="text-sm text-dark/70">Erster Besuch in diesem Salon</span>
          </label>

          {/* Recurring */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="w-4 h-4 rounded accent-teal"
            />
            <span className="text-sm text-dark/70">Serienbuchung</span>
            <RotateCcw className="w-3.5 h-3.5 text-teal" />
          </label>
          {recurring && (
            <select
              value={recurringFreq}
              onChange={(e) => setRecurringFreq(e.target.value as RecurringFrequency)}
              className="text-sm px-3 py-1.5 rounded-button border border-gray-200 bg-white outline-none focus:border-teal"
            >
              {FREQ_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}

          {/* Booking summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-dark">
                {locale === "de" ? selectedSlot.services?.name_de : selectedSlot.services?.name_en}
              </p>
              <p className="text-xs text-dark/50 mt-0.5">
                {new Date(selectedSlot.starts_at).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", {
                  weekday: "short", day: "numeric", month: "short",
                })}{" · "}
                {new Date(selectedSlot.starts_at).toLocaleTimeString(locale === "de" ? "de-CH" : "en-GB", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <span className="font-data font-bold text-lg text-dark">
              CHF {selectedSlot.price_override ?? selectedSlot.services?.price ?? "–"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-dark/40">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Kostenlose Stornierung bis 24h vor Termin
          </div>

          {error && <p className="text-xs text-coral">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-button bg-coral text-white font-semibold text-sm hover:bg-coral/90 transition-colors disabled:opacity-50"
          >
            {confirming && <Spinner size="sm" invert />}
            {confirming ? "Buchen…" : "Termin bestätigen"}
          </button>
        </div>
      )}
    </div>
  );
}
