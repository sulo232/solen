"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, X, Lock, ArrowRight, Clock, CalendarX } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/app/[locale]/_components/primitives/Modal";
import Spinner from "@/components-legacy/ui/Spinner";
import ErrorState from "@/components-legacy/ui/ErrorState";
import WalkInModal from "@/components-legacy/dashboard/WalkInModal";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { AvailabilitySlot } from "@/lib/types";
import { resolveSwissLocale } from "@/lib/format";
import { zurichYmd, zurichCalendarRange, zurichWallClockToUtc } from "@/lib/time/zurich";
import { localizedField } from "@/lib/i18n/localized-field";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

type ViewMode = "day" | "week" | "month";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

function getMonthCalendarDays(date: Date): Date[] {
  const first = startOfMonth(date);
  const startDay = first.getUTCDay() === 0 ? 6 : first.getUTCDay() - 1; // Mon=0
  const start = addDays(first, -startDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(start, i));
  return days;
}

// Europe/Zurich YYYY-MM-DD, not the browser's ambient timezone. Salon owners operate
// in Switzerland; a browser/device set to another zone (a laptop left on UTC, a trip
// abroad) would otherwise shift "today" and every day bucket by a day near midnight.
// Delegates to the shared lib/time/zurich helper (one Intl.DateTimeFormat instance) instead
// of a page-local copy.
function ymdLocal(d: Date): string {
  return zurichYmd(d);
}

// /api/services returns locale-columned rows (name_de/name_en/name_fr/name_it), no
// generic `name` (see app/api/services/route.ts .select("*")). Resolve the display
// name for the current locale, falling back to name_de since the services editor
// requires it (app/[locale]/dashboard/services/page.tsx handleSave: if (!form.name_de) return;).
type RawServiceRow = {
  id: string;
  name_de: string;
  name_en?: string | null;
  name_fr?: string | null;
  name_it?: string | null;
  category?: string;
};

function serviceName(s: RawServiceRow, locale: string): string {
  return localizedField(s as Record<string, unknown>, "name", locale) || s.name_de;
}

// ─────────────────────────────────────────
// Slot Create Modal
// ─────────────────────────────────────────

interface SlotModalProps {
  date: string;
  startTime: string;
  initialStaffId?: string;
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}

function SlotCreateModal({ date, startTime, initialStaffId, services, staff, onClose, onCreated }: SlotModalProps) {
  const t = useTranslations("dashboard.calendarPage");
  const common = useTranslations("common");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState(initialStaffId ?? "");
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState(false);

  const handleCreate = async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, start_time: startTime, service_id: serviceId, staff_member_id: staffId || null }),
      });
      if (!response.ok) throw new Error(`Slot creation failed (${response.status})`);
      onCreated();
      onClose();
      // V3-D334 (overnight T2): error handling per CLAUDE.md (was silent catch).
    } catch (err) { setCreateError(true); console.error("[Calendar] single slot create failed:", err); } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} size="sm"
      aria-label={t("createSlotTitle")}
      className="w-full max-w-sm rounded-input shadow-warm-lg"
      overlayClassName="bg-s-ink/40 backdrop-blur-sm">
      <div className="overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base">{t("createSlotTitle")}</h3>
          <button onClick={onClose} aria-label={t("cancel")} className={`grid h-11 w-11 place-items-center ${CALENDAR_FOCUS}`}><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>
        <p className="text-sm text-s-ink-2 mb-4">{t("dateAtTime", { date, time: startTime })}</p>
        {createError ? <ErrorState title={common("errorSaving")} retryLabel={t("retry")} onRetry={() => { onCreated(); onClose(); }} /> : <>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs text-s-ink-2 mb-1">{t("serviceRequired")}</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <option value="">{t("choosePlaceholder")}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-s-ink-2 mb-1">{t("staffLabel")}</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <option value="">{t("anyStaffAvailable")}</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className={`flex-1 min-h-11 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 ${CALENDAR_FOCUS}`} >{t("cancel")}</button>
          <button onClick={handleCreate} disabled={!serviceId || loading}
            className={`flex-1 min-h-11 py-2.5 rounded-btn bg-s-ink text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${CALENDAR_FOCUS}`} >
            {loading && <Spinner size="sm" invert />}{t("create")}
          </button>
        </div>
        </>}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────
// Bulk Create Modal
// ─────────────────────────────────────────

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
// 24h-only select options: a native <input type="time"> takes its AM/PM vs 24h display
// format from the browser's own locale, not the page language or an element lang attribute
// (measured, see removed lang="de-CH" below), so hour/minute are plain selects instead.
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_OPTIONS = ["00", "15", "30", "45"]; // quarter-hour granularity is enough for opening hours

function BulkCreateModal({ services, staff, salonId, onClose, onCreated }: {
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  salonId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations("dashboard.calendarPage");
  const common = useTranslations("common");
  const locale = useLocale();
  const [template, setTemplate] = useState<Record<string, { start: string; end: string } | null>>(
    Object.fromEntries(DAY_KEYS.map((k, i) => [k, i < 5 ? { start: "09:00", end: "18:00" } : null]))
  );
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [weeks, setWeeks] = useState<1 | 2 | 4>(2);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState(false);

  const handleCreate = async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/slots/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, template, service_id: serviceId, staff_member_id: staffId || null, weeks }),
      });
      if (!response.ok) throw new Error(`Slot creation failed (${response.status})`);
      onCreated();
      onClose();
      // V3-D334 (overnight T2): error handling per CLAUDE.md (was silent catch).
    } catch (err) { setCreateError(true); console.error("[Calendar] bulk slot create failed:", err); } finally {
      setLoading(false);
    }
  };

  const toggleDay = (key: string) => {
    setTemplate((prev) => ({ ...prev, [key]: prev[key] ? null : { start: "09:00", end: "18:00" } }));
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} size="md"
      aria-label={t("createWeekScheduleTitle")}
      className="w-full max-w-md rounded-input shadow-warm-lg"
      overlayClassName="bg-s-ink/40 backdrop-blur-sm">
      <div className="max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base">{t("createWeekScheduleTitle")}</h3>
          <button onClick={onClose} aria-label={t("cancel")} className={`grid h-11 w-11 place-items-center ${CALENDAR_FOCUS}`}><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>
        {createError ? <ErrorState title={common("errorSaving")} retryLabel={t("retry")} onRetry={() => { onCreated(); onClose(); }} /> : <>
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs text-s-ink-2 mb-1">{t("serviceRequired")}</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <option value="">{t("choosePlaceholder")}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-s-ink-2 mb-1">{t("staffLabel")}</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <option value="">{t("anyStaff")}</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-s-ink-2 mb-2">{t("scheduleLabel")}</label>
            <div className="space-y-2">
              {DAY_KEYS.map((key, i) => {
                const slot = template[key];
                // Full weekday name for the select aria-labels only (visible pill keeps DAY_LABELS' short form).
                // 2024-01-01 is a Monday, matching DAY_KEYS order (mon..sun).
                const dayFullName = new Date(2024, 0, 1 + i).toLocaleDateString(resolveSwissLocale(locale), { weekday: "long" });
                return (
                  <div key={key} className="flex items-center gap-3 flex-wrap">
                    <button type="button" onClick={() => toggleDay(key)}
                      className={["min-h-11 min-w-11 text-center text-xs py-1.5 rounded-btn transition-colors", // mockup-ok: C2 fix, locked TabPill treatment (approved public/_mockups/fixes-refined)
                        slot ? "bg-s-bg-sunken text-s-ink font-semibold" : "bg-s-bg-sunken text-s-ink/40"].join(" ")}>
                      {new Date(Date.UTC(2024, 0, 1 + i, 12)).toLocaleDateString(resolveSwissLocale(locale), { weekday: "short", timeZone: "UTC" })}
                    </button>
                    {slot ? (
                      <div className="flex w-full items-center gap-2">
                        <select aria-label={`${dayFullName} Start Stunde`} value={slot.start.split(":")[0]}
                          onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, start: `${e.target.value}:${slot.start.split(":")[1]}` } }))}
                          className="px-2 py-1 text-xs h-11 flex-1">{HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}</select> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                        <select aria-label={`${dayFullName} Start Minute`} value={slot.start.split(":")[1]}
                          onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, start: `${slot.start.split(":")[0]}:${e.target.value}` } }))}
                          className="px-2 py-1 text-xs h-11 flex-1">{MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}</select> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                        <span className="text-xs text-s-ink/30">-</span>
                        <select aria-label={`${dayFullName} Ende Stunde`} value={slot.end.split(":")[0]}
                          onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, end: `${e.target.value}:${slot.end.split(":")[1]}` } }))}
                          className="px-2 py-1 text-xs h-11 flex-1">{HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}</select> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                        <select aria-label={`${dayFullName} Ende Minute`} value={slot.end.split(":")[1]}
                          onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, end: `${slot.end.split(":")[0]}:${e.target.value}` } }))}
                          className="px-2 py-1 text-xs h-11 flex-1">{MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}</select> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                      </div>
                    ) : <span className="text-xs text-s-ink/30">{t("notAvailable")}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-s-ink-2 mb-2">{t("weeksLabel")}</label>
            <div className="flex gap-2">
              {([1, 2, 4] as const).map((w) => (
                <button key={w} type="button" onClick={() => setWeeks(w)}
                  className={["flex-1 py-2 rounded-btn border text-sm transition-colors", // mockup-ok: C2 fix, locked TabPill treatment (approved public/_mockups/fixes-refined)
                    weeks === w ? "bg-s-bg-sunken text-s-ink font-semibold border-s-border" : "border-s-border text-s-ink-2"].join(" ")}>
                  {w} {w === 1 ? t("weekSingular") : t("weekPlural")}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className={`flex-1 min-h-11 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 ${CALENDAR_FOCUS}`} >{t("cancel")}</button>
          <button onClick={handleCreate} disabled={!serviceId || loading}
            className={`flex-1 min-h-11 py-2.5 rounded-btn bg-s-ink text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${CALENDAR_FOCUS}`} >
            {loading && <Spinner size="sm" invert />}{t("create")}
          </button>
        </div>
        </>}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────
// Slot Detail / Reschedule Modal
// ─────────────────────────────────────────

interface SlotDetailModalProps {
  slot: AvailabilitySlot;
  staff: { id: string; name: string }[];
  onClose: () => void;
  onReschedule: (slotId: string, newDate: string, newTime: string, staffId: string | null) => void;
  onDelete: (slotId: string) => void;
}

function SlotDetailModal({ slot, staff, onClose, onReschedule, onDelete }: SlotDetailModalProps) {
  const t = useTranslations("dashboard.calendarPage");
  const locale = useLocale();
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [newDate, setNewDate] = useState(zurichYmd(new Date(slot.starts_at)));
  const [newTime, setNewTime] = useState(calendarWallFormat.format(new Date(slot.starts_at)));
  const [newStaffId, setNewStaffId] = useState(slot.staff_member_id ?? "");
  const [loading, setLoading] = useState(false);

  const staffName = staff.find((s) => s.id === slot.staff_member_id)?.name || t("anyStaff");
  const startTime = calendarTime(new Date(slot.starts_at), locale);
  const endTime = calendarTime(new Date(slot.ends_at), locale);

  const handleReschedule = async () => {
    setLoading(true);
    try {
      onReschedule(slot.id, newDate, newTime, newStaffId || null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} size="sm"
      aria-label={rescheduleMode ? t("rescheduleTitle") : t("detailsTitle")}
      className="w-full max-w-sm rounded-input p-6 shadow-warm-lg"
      overlayClassName="bg-s-ink/40 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base">
            {rescheduleMode ? t("rescheduleTitle") : t("detailsTitle")}
          </h3>
          <button onClick={onClose} aria-label={t("cancel")} className={`grid h-11 w-11 place-items-center ${CALENDAR_FOCUS}`}><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>

        {rescheduleMode ? (
          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs text-s-ink-2 mb-1">{t("newDate")}</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
            <div>
              <label className="block text-xs text-s-ink-2 mb-1">{t("newTime")}</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
            <div><label className="block text-xs text-s-ink-2 mb-1">{t("staffLabel")}</label><select aria-label={t("staffLabel")} value={newStaffId} onChange={(event) => setNewStaffId(event.target.value)} className="w-full px-3 py-2 text-sm"><option value="">{t("unassigned")}</option>{staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRescheduleMode(false)}
                className="flex-1 min-h-11 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2">{t("back")}</button>
              <button onClick={handleReschedule} disabled={loading}
                className={`flex-1 min-h-11 py-2.5 rounded-btn bg-s-ink text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${CALENDAR_FOCUS}`} >
                {loading && <Spinner size="sm" invert />}
                <ArrowRight size={14} strokeWidth={1.6} /> {t("reschedule")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-5 text-sm text-s-ink/70">
              <p><span className="text-s-ink/40">{t("statusLabel")}</span> <span>{slot.status === "booked" ? t("statusBooked") : slot.status === "blocked" ? t("statusBlocked") : t("statusFree")}</span></p>
              <p><span className="text-s-ink/40">{t("timeLabel")}</span> {startTime} - {endTime}</p>
              <p><span className="text-s-ink/40">{t("dateLabel")}</span> {new Date(slot.starts_at).toLocaleDateString(resolveSwissLocale(locale), { timeZone: "Europe/Zurich" })}</p>
              <p><span className="text-s-ink/40">{t("staffDetailLabel")}</span> {staffName}</p>
            </div>
            <div className="flex gap-2">
              {slot.status !== "blocked" && (
                <button onClick={() => setRescheduleMode(true)}
                  className="flex-1 min-h-11 py-2.5 rounded-btn border border-s-accent-bright text-s-accent-bright text-sm font-medium flex items-center justify-center gap-1 hover:bg-s-accent-bright/5 transition-colors">
                  <Clock size={14} strokeWidth={1.6} /> {t("reschedule")}
                </button>
              )}
              <button onClick={() => { onDelete(slot.id); onClose(); }}
                className="flex-1 min-h-11 py-2.5 rounded-btn border border-s-accent-bright text-s-accent-bright text-sm font-medium hover:bg-s-accent-bright/5 transition-colors">
                {t("delete")}
              </button>
            </div>
          </>
        )}
    </Modal>
  );
}

// Operator screen: the approved staff-column day calendar is the primary work surface.
// Phone retains a chronological agenda so short appointments never share a hit area.
type CalendarSlot = AvailabilitySlot & {
  services?: Record<string, unknown> | null;
  staff_members?: { name?: string } | null;
};
type CalendarBooking = {
  id: string;
  slot_id: string | null;
  service_id: string | null;
  staff_member_id: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  customer_name: string;
  service_name: string;
  staff_name: string | null;
  services?: Record<string, unknown> | null;
};
type CalendarItem = {
  id: string;
  starts_at: string;
  ends_at: string;
  staff_member_id: string | null;
  label: string;
  service: string;
  staffName?: string;
  status: string;
  slot?: AvailabilitySlot;
  booking?: CalendarBooking;
};
const CALENDAR_FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2";
const CALENDAR_CONTROL = `h-11 rounded-btn border border-s-border bg-white px-4 text-sm font-semibold text-s-ink ${CALENDAR_FOCUS}`;
const calendarDate = (date: Date) => new Date(`${zurichYmd(date)}T12:00:00Z`);
const calendarWallFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const calendarTimeFormats = new Map<string, Intl.DateTimeFormat>();
const calendarTime = (date: Date, locale: string) => {
  const base: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };
  const wall = (instant: Date) => calendarWallFormat.format(instant);
  const repeated = [-1, 1].some((direction) => {
    const neighbor = new Date(date.getTime() + direction * 3600000);
    return (
      zurichYmd(neighbor) === zurichYmd(date) && wall(neighbor) === wall(date)
    );
  });
  const key = `${locale}:${Boolean(date.getUTCSeconds())}:${Boolean(date.getUTCMilliseconds())}:${repeated}`;
  let formatter = calendarTimeFormats.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(resolveSwissLocale(locale), {
      ...base,
      ...(date.getUTCSeconds() || date.getUTCMilliseconds()
        ? { second: "2-digit" as const }
        : {}),
      ...(date.getUTCMilliseconds()
        ? { fractionalSecondDigits: 3 as const }
        : {}),
      ...(repeated ? { timeZoneName: "shortOffset" as const } : {}),
    });
    calendarTimeFormats.set(key, formatter);
  }
  return formatter.format(date);
};

async function readCalendarPopulation<
  T extends { id: string; starts_at: string; ends_at: string },
>(url: string, key: "slots" | "bookings", signal: AbortSignal): Promise<T[]> {
  const rows: T[] = [];
  const seen = new Set<string>();
  let expected: number | null = null;
  do {
    const response = await fetch(`${url}&offset=${rows.length}`, { signal });
    if (!response.ok)
      throw new Error(`${key} request failed (${response.status})`);
    const data = await response.json();
    const page = data[key] as T[];
    if (
      !Array.isArray(page) ||
      !Number.isSafeInteger(data.total) ||
      data.total < 0 ||
      (expected !== null && expected !== data.total)
    )
      throw new Error(`${key} population changed or unavailable`);
    expected = Number(data.total);
    if (!page.length && rows.length < expected)
      throw new Error(`${key} population incomplete`);
    for (const row of page) {
      if (
        !Number.isFinite(Date.parse(row.starts_at)) ||
        !Number.isFinite(Date.parse(row.ends_at)) ||
        Date.parse(row.ends_at) <= Date.parse(row.starts_at)
      )
        throw new Error(`${key} has an invalid time interval`);
      if (!row.id || seen.has(row.id))
        throw new Error(`${key} identity repeated or missing`);
      seen.add(row.id);
      rows.push(row);
    }
    if (rows.length > expected)
      throw new Error(`${key} population exceeded count`);
  } while (rows.length < expected!);
  return rows;
}

export default function CalendarPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.calendarPage");
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [mobileView, setMobileView] = useState<"tag" | "woche" | "monat">(
    "tag",
  );
  const [currentDate, setCurrentDate] = useState(() =>
    calendarDate(new Date()),
  );
  const [staffFilter, setStaffFilter] = useState("all");
  const [selectedStaffName, setSelectedStaffName] = useState("");
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const common = useTranslations("common");
  const [salonReady, setSalonReady] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [services, setServices] = useState<
    { id: string; name: string; category?: string }[]
  >([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [createModal, setCreateModal] = useState<{
    date: string;
    time: string;
    staffId?: string;
  } | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [detailSlot, setDetailSlot] = useState<AvailabilitySlot | null>(null);
  const [detailBooking, setDetailBooking] = useState<CalendarBooking | null>(
    null,
  );
  const [detailGroup, setDetailGroup] = useState<CalendarItem[] | null>(null);
  const [walkInModal, setWalkInModal] = useState(false);
  const [retry, setRetry] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const loadSlots = useCallback(() => setRefresh((value) => value + 1), []);
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthActive = viewMode === "month" || mobileView === "monat";
  const rangeDays = monthActive ? getMonthCalendarDays(currentDate) : weekDays;
  const from = ymdLocal(rangeDays[0]);
  const to = ymdLocal(rangeDays[rangeDays.length - 1]);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setSalonReady(false);
    setSalonId(null);
    setError(false);
    setActionError(false);
    setStaffFilter("all");
    setSelectedStaffName("");
    setStaff([]);
    setServices([]);
    setSlots([]);
    setBookings([]);
    setDetailSlot(null);
    setDetailBooking(null);
    setDetailGroup(null);
    async function loadContext() {
      try {
        const profileResponse = await fetch("/api/profile", {
          signal: controller.signal,
        });
        if (!profileResponse.ok)
          throw new Error(`profile ${profileResponse.status}`);
        const profile = await profileResponse.json();
        const id = profile?.salon_id ?? profile?.staff_salon_id;
        if (!profile?.id || !id) throw new Error("Active Store unavailable");
        const responses = await Promise.all([
          fetch(`/api/services?salon_id=${encodeURIComponent(id)}`, {
            signal: controller.signal,
          }),
          fetch(`/api/staff?salon_id=${encodeURIComponent(id)}`, {
            signal: controller.signal,
          }),
        ]);
        if (responses.some((response) => !response.ok))
          throw new Error("Calendar services or staff unavailable");
        const [serviceData, staffData] = await Promise.all(
          responses.map((response) => response.json()),
        );
        if (
          !Array.isArray(serviceData.services) ||
          !Array.isArray(staffData.staff)
        )
          throw new Error("Calendar context incomplete");
        if (!current) return;
        setServices(
          serviceData.services.map((service: RawServiceRow) => ({
            id: service.id,
            name: serviceName(service, locale),
            category: service.category,
          })),
        );
        setStaff(staffData.staff);
        setSalonId(id);
      } catch (err) {
        if (current) {
          console.error("[Calendar] context load failed:", err);
          setError(true);
        }
      } finally {
        if (current) setSalonReady(true);
      }
    }
    void loadContext();
    return () => {
      current = false;
      controller.abort();
    };
  }, [locale, retry]);

  useEffect(() => {
    if (!salonId) return;
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError(false);
    const params = `salon_id=${encodeURIComponent(salonId)}&calendar=1&from=${from}&to=${to}`;
    Promise.all([
      readCalendarPopulation<CalendarSlot>(
        `/api/slots?${params}`,
        "slots",
        controller.signal,
      ),
      readCalendarPopulation<CalendarBooking>(
        `/api/bookings?${params}&limit=100`,
        "bookings",
        controller.signal,
      ),
    ])
      .then(([nextSlots, nextBookings]) => {
        if (!current) return;
        setSlots(nextSlots);
        setBookings(nextBookings);
      })
      .catch((err) => {
        if (current) {
          console.error("[Calendar] interval load failed:", err);
          setError(true);
          setSlots([]);
          setBookings([]);
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [salonId, from, to, refresh]);

  useEffect(() => {
    if (!salonId) return;
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(
        `salon-calendar-${salonId}-${Math.random().toString(36).slice(2)}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availability_slots",
          filter: `salon_id=eq.${salonId}`,
        },
        loadSlots,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `salon_id=eq.${salonId}`,
        },
        loadSlots,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [salonId, loadSlots]);

  const items = useMemo(() => {
    const activeBookings = bookings.filter(
      (booking) => booking.status !== "cancelled",
    );
    const backedSlots = new Set(
      activeBookings.map((booking) => booking.slot_id).filter(Boolean),
    );
    return [
      ...activeBookings.map((booking): CalendarItem => ({
        ...booking,
        id: `booking:${booking.id}`,
        label: booking.customer_name,
        service:
          localizedField(booking.services, "name", locale) ||
          booking.service_name,
        staffName: booking.staff_name ?? undefined,
        booking,
      })),
      ...slots
        .filter((slot) => !backedSlots.has(slot.id))
        .map((slot): CalendarItem => ({
          ...slot,
          id: `slot:${slot.id}`,
          label:
            slot.status === "blocked"
              ? t("statusBlocked")
              : slot.status === "booked"
                ? t("statusBooked")
                : t("statusFree"),
          service:
            localizedField(slot.services, "name", locale) ||
            services.find((service) => service.id === slot.service_id)?.name ||
            "",
          staffName: slot.staff_members?.name,
          slot,
        })),
    ].sort(
      (a, b) =>
        Date.parse(a.starts_at) - Date.parse(b.starts_at) ||
        a.id.localeCompare(b.id),
    );
  }, [bookings, slots, services, locale, t]);
  const staffOptions = [...staff];
  for (const item of items)
    if (
      item.staff_member_id &&
      !staffOptions.some((member) => member.id === item.staff_member_id)
    )
      staffOptions.push({
        id: item.staff_member_id,
        name: item.staffName || t("staffLabel"),
      });
  if (
    staffFilter !== "all" &&
    staffFilter !== "unassigned" &&
    !staffOptions.some((member) => member.id === staffFilter)
  )
    staffOptions.push({
      id: staffFilter,
      name: selectedStaffName || t("staffLabel"),
    });
  const filteredItems = items.filter(
    (item) =>
      staffFilter === "all" ||
      (item.staff_member_id ?? "unassigned") === staffFilter,
  );
  const itemsForDay = (date: Date) => {
    const range = zurichCalendarRange(ymdLocal(date), ymdLocal(date))!;
    return filteredItems.filter(
      (item) =>
        Date.parse(item.starts_at) < Date.parse(range.end) &&
        Date.parse(item.ends_at) > Date.parse(range.start),
    );
  };
  const openItem = (item: CalendarItem) => {
    setDetailGroup(null);
    if (item.booking) setDetailBooking(item.booking);
    else if (item.slot) setDetailSlot(item.slot);
  };
  const itemName = (item: CalendarItem) =>
    `${calendarTime(new Date(item.starts_at), locale)} - ${calendarTime(new Date(item.ends_at), locale)} ${item.label} ${item.service}`;
  const today = () => setCurrentDate(calendarDate(new Date()));
  const navigate = (mode: ViewMode, direction: number) => {
    setCurrentDate((date) =>
      mode === "month"
        ? new Date(
            Date.UTC(
              date.getUTCFullYear(),
              date.getUTCMonth() + direction,
              1,
              12,
            ),
          )
        : addDays(date, direction * (mode === "week" ? 7 : 1)),
    );
  };
  const mutate = async (url: string, init: RequestInit) => {
    const response = await fetch(url, init);
    if (!response.ok)
      throw new Error(`Calendar action failed (${response.status})`);
    loadSlots();
  };
  const deleteSlot = async (id: string) => {
    try {
      await mutate(`/api/slots/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("[Calendar] delete failed:", err);
      setActionError(true);
      setError(true);
    }
  };
  const rescheduleSlot = async (
    id: string,
    date: string,
    startTime: string,
    staffId: string | null,
  ) => {
    try {
      const slot = slots.find((candidate) => candidate.id === id);
      if (!slot) throw new Error("Slot unavailable for rescheduling");
      const [hour, minute] = startTime.split(":").map(Number);
      const original = new Date(slot.starts_at);
      // Reassigning without changing the clock preserves its exact instant,
      // including seconds and the first occurrence of a repeated DST hour.
      const start =
        date === zurichYmd(original) &&
        startTime === calendarWallFormat.format(original)
          ? original
          : zurichWallClockToUtc(date, hour, minute);
      if (
        zurichYmd(start) !== date ||
        calendarWallFormat.format(start) !== startTime
      )
        throw new Error("Selected local time does not exist");
      const end = new Date(
        start.getTime() + Date.parse(slot.ends_at) - Date.parse(slot.starts_at),
      );
      await mutate(`/api/slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          staff_member_id: staffId,
        }),
      });
    } catch (err) {
      console.error("[Calendar] reschedule failed:", err);
      setActionError(true);
      setError(true);
    }
  };
  const blockDay = async (date: string) => {
    try {
      await mutate("/api/slots/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, block_date: date }),
      });
    } catch (err) {
      console.error("[Calendar] block day failed:", err);
      setActionError(true);
      setError(true);
    }
  };
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const [, id] = result.draggableId.split(":");
    const slot = slots.find((candidate) => candidate.id === id);
    if (!slot || slot.status !== "available") return;
    const [, stamp, member] = result.destination.droppableId.split("|");
    const start = new Date(stamp);
    if (!Number.isFinite(start.getTime())) return;
    const end = new Date(
      start.getTime() +
        new Date(slot.ends_at).getTime() -
        new Date(slot.starts_at).getTime(),
    );
    void mutate(`/api/slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        staff_member_id: member === "unassigned" ? null : member,
      }),
    }).catch((err) => {
      console.error("[Calendar] drag failed:", err);
      setActionError(true);
      setError(true);
    });
  };
  const showError = salonReady && (error || !salonId);
  const showSpinner = !salonReady || (loading && !showError);
  const errorState = (
    <ErrorState
      icon={CalendarX}
      title={actionError ? common("errorSaving") : t("loadErrorTitle")}
      message={actionError ? undefined : t("loadErrorMessage")}
      retryLabel={t("retry")}
      onRetry={() => setRetry((value) => value + 1)}
    />
  );
  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString(resolveSwissLocale(locale), {
      ...options,
      timeZone: "Europe/Zurich",
    });
  const dateLabel = (mode: ViewMode) =>
    mode === "month"
      ? formatDate(currentDate, { month: "long", year: "numeric" })
      : mode === "week"
        ? `${formatDate(weekStart, { day: "numeric", month: "long" })} - ${formatDate(addDays(weekStart, 6), { day: "numeric", month: "long", year: "numeric" })}`
        : formatDate(currentDate, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
  const staffSelect = (
    <select
      aria-label={t("staffLabel")}
      value={staffFilter}
      onChange={(event) => {
        setStaffFilter(event.target.value);
        setSelectedStaffName(
          staffOptions.find((member) => member.id === event.target.value)
            ?.name ?? "",
        );
      }}
      className={`${CALENDAR_CONTROL} max-w-full`}
    >
      <option value="all">{t("allStaff")}</option>
      {staffOptions.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
      <option value="unassigned">{t("unassigned")}</option>
    </select>
  );

  const renderItemRows = (dayItems: CalendarItem[]) => (
    <div className="space-y-2" data-calendar-agenda>
      {dayItems.map((item) => (
        <button
          key={item.id}
          data-calendar-event={item.id}
          aria-label={itemName(item)}
          onClick={() => openItem(item)}
          className={`flex min-h-11 w-full items-start gap-4 rounded-btn py-3 text-left ${CALENDAR_FOCUS}`}
        >
          <span className="w-24 shrink-0 text-xs tabular-nums text-s-ink-2">
            {calendarTime(new Date(item.starts_at), locale)} -{" "}
            {calendarTime(new Date(item.ends_at), locale)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-s-ink">
              {item.label}
            </span>
            <span className="block text-sm text-s-ink-2">{item.service}</span>
            <span className="block text-xs text-s-ink-2">
              {staffOptions.find((member) => member.id === item.staff_member_id)
                ?.name ?? t("unassigned")}
            </span>
          </span>
        </button>
      ))}
    </div>
  );

  const renderAgenda = () => {
    const dayItems = itemsForDay(currentDate);
    return dayItems.length ? (
      renderItemRows(dayItems)
    ) : (
      <p className="py-12 text-center text-sm text-s-ink-2">
        {t("noSlotsThisDay")}
      </p>
    );
  };

  const renderMonth = (mobile: boolean) => (
    <div
      className="overflow-hidden rounded-card border border-s-border bg-white"
      data-calendar-month={mobile ? "mobile" : "desktop"}
    >
      <div className="grid grid-cols-7">
        {weekDays.map((day) => (
          <div
            key={ymdLocal(day)}
            className="py-3 text-center text-xs text-s-ink-2"
          >
            {formatDate(day, { weekday: "short" })}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {getMonthCalendarDays(currentDate).map((day) => {
          const dayItems = itemsForDay(day);
          const counts = {
            booked: dayItems.filter(
              (item) => item.booking || item.status === "booked",
            ).length,
            available: dayItems.filter(
              (item) => item.slot?.status === "available",
            ).length,
            blocked: dayItems.filter((item) => item.slot?.status === "blocked")
              .length,
          };
          return (
            <button
              key={ymdLocal(day)}
              data-calendar-date={ymdLocal(day)}
              aria-label={formatDate(day, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              onClick={() => {
                setCurrentDate(day);
                if (mobile) setMobileView("tag");
                else setViewMode("day");
              }}
              className={`min-h-11 border-t border-r border-s-border p-2 text-left text-xs tabular-nums ${mobile ? "aspect-square" : "min-h-20"} ${day.getUTCMonth() !== currentDate.getUTCMonth() ? "text-s-ink-2" : "text-s-ink"} ${CALENDAR_FOCUS}`}
            >
              <span
                className={
                  ymdLocal(day) === zurichYmd(new Date()) ? "font-semibold" : ""
                }
              >
                {day.getUTCDate()}
              </span>
              <span className="mt-2 flex flex-wrap gap-1">
                {counts.booked > 0 && (
                  <span
                    className="h-2 w-2 rounded-full bg-s-ink"
                    title={t("bookedCount", { count: counts.booked })}
                  />
                )}
                {counts.available > 0 && (
                  <span
                    className="h-2 w-2 rounded-full bg-s-ink-2"
                    title={t("availableCount", { count: counts.available })}
                  />
                )}
                {counts.blocked > 0 && (
                  <span
                    className="h-2 w-2 rounded-full border border-s-border"
                    title={t("blockedCount", { count: counts.blocked })}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTimeline = () => {
    const dayItems = itemsForDay(currentDate);
    const members = staffOptions.filter(
      (member) => staffFilter === "all" || member.id === staffFilter,
    );
    if (
      (!members.length || dayItems.some((item) => !item.staff_member_id)) &&
      (staffFilter === "all" || staffFilter === "unassigned")
    )
      members.push({ id: "unassigned", name: t("unassigned") });
    const columns =
      viewMode === "week"
        ? weekDays.map((date) => ({
            id: ymdLocal(date),
            name: formatDate(date, { weekday: "short", day: "numeric" }),
            date,
            member: staffFilter,
          }))
        : members.map((member) => ({
            ...member,
            date: currentDate,
            member: member.id,
          }));
    const positioned = columns.map((column) => {
      const day = ymdLocal(column.date);
      const range = zurichCalendarRange(day, day)!;
      const dayStart = new Date(range.start).getTime();
      const dayEnd = new Date(range.end).getTime();
      const entries = itemsForDay(column.date)
        .filter(
          (item) =>
            viewMode === "week" ||
            (item.staff_member_id ?? "unassigned") === column.member,
        )
        .map((item) => ({
          item,
          start:
            (Math.max(dayStart, new Date(item.starts_at).getTime()) -
              dayStart) /
            60000,
          end:
            (Math.min(dayEnd, new Date(item.ends_at).getTime()) - dayStart) /
            60000,
        }));
      const groups: {
        entries: typeof entries;
        start: number;
        end: number;
        hitStart: number;
        hitEnd: number;
      }[] = [];
      for (const entry of entries) {
        const last = groups[groups.length - 1];
        const hitStart = Math.min(
          entry.start,
          (dayEnd - dayStart) / 60000 - 44 / (88 / 60),
        );
        const hitEnd = Math.max(entry.end, hitStart + 44 / (88 / 60));
        if (last && hitStart < last.hitEnd) {
          last.entries.push(entry);
          last.hitStart = Math.min(last.hitStart, hitStart);
          last.end = Math.max(last.end, entry.end);
          last.hitEnd = Math.max(last.hitEnd, hitEnd);
        } else
          groups.push({
            entries: [entry],
            start: entry.start,
            end: entry.end,
            hitStart,
            hitEnd,
          });
      }
      return { column, entries, groups, dayStart, dayEnd };
    });
    const allEntries = positioned.flatMap((column) => column.entries);
    const startMinute =
      Math.floor(
        Math.min(8 * 60, ...allEntries.map((entry) => entry.start)) / 60,
      ) * 60;
    const endMinute =
      Math.ceil(
        Math.max(20 * 60, ...allEntries.map((entry) => entry.end)) / 60,
      ) * 60;
    // Use a bounded 88px/hour overview (30 minutes is 44px). Separate 44px targets are clustered
    // when their hit ranges intersect; the true time spans remain proportional.
    // Every appointment is individually selectable in the existing modal rows.
    const pixelsPerMinute = 88 / 60;
    const height = (endMinute - startMinute) * pixelsPerMinute;
    const ticks = Array.from(
      { length: (endMinute - startMinute) / 60 + 1 },
      (_, index) => startMinute + index * 60,
    );
    return (
      <div
        className="overflow-x-auto rounded-card border border-s-border bg-white"
        data-calendar-timeline={viewMode}
      >
        <div style={{ minWidth: 56 + columns.length * 160 }}>
          <div className="flex border-b border-s-border">
            <div className="w-14 shrink-0" />
            {columns.map((column) => (
              <div
                key={column.id}
                className="min-w-0 flex-1 border-l border-s-border px-2 py-4 text-center"
              >
                {viewMode === "day" && (
                  <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-s-bg-sunken text-xs font-semibold text-s-ink">
                    {column.name.charAt(0)}
                  </span>
                )}
                <span className="mt-1 block truncate text-sm font-semibold text-s-ink">
                  {column.name}
                </span>
                {viewMode === "week" && (
                  <button
                    onClick={() => void blockDay(ymdLocal(column.date))}
                    aria-label={`${t("blockDay")} ${column.name}`}
                    className={`mx-auto flex h-11 w-11 items-center justify-center text-s-ink-2 ${CALENDAR_FOCUS}`}
                  >
                    <Lock size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex" style={{ height }}>
            <div className="relative w-14 shrink-0" aria-hidden>
              {viewMode === "day" &&
                ticks.map((minute) => (
                  <span
                    key={minute}
                    className="absolute right-2 text-xs tabular-nums text-s-ink-2"
                    style={{ top: (minute - startMinute) * pixelsPerMinute }}
                  >
                    {calendarTime(
                      new Date((positioned[0]?.dayStart ?? 0) + minute * 60000),
                      locale,
                    )}
                  </span>
                ))}
            </div>
            {positioned.map(({ column, entries, groups, dayStart }) => (
              <div
                key={column.id}
                className="relative min-w-0 flex-1 border-l border-s-border"
                data-calendar-column={column.id}
              >
                {ticks.slice(0, -1).map((minute) => {
                  const instant = new Date(dayStart + minute * 60000);
                  const wall = calendarTime(instant, "en");
                  const localParts = calendarWallFormat.format(instant);
                  const [hour, minutes] = localParts.split(":").map(Number);
                  const createSupported =
                    zurichYmd(instant) === ymdLocal(column.date) &&
                    zurichWallClockToUtc(
                      ymdLocal(column.date),
                      hour,
                      minutes,
                    ).getTime() === instant.getTime();
                  const member =
                    column.member === "all" ? "unassigned" : column.member;
                  const dropId = `${ymdLocal(column.date)}|${instant.toISOString()}|${member}`;
                  return (
                    <Droppable key={minute} droppableId={dropId}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="absolute inset-x-0 border-t border-s-border"
                          style={{
                            top: (minute - startMinute) * pixelsPerMinute,
                            height: 60 * pixelsPerMinute,
                          }}
                        >
                          <button
                            aria-label={`${t("createSlotTitle")} ${column.name} ${wall}`}
                            disabled={!createSupported}
                            onClick={() =>
                              setCreateModal({
                                date: ymdLocal(column.date),
                                time: localParts,
                                staffId: member === "unassigned" ? "" : member,
                              })
                            }
                            className={`h-full w-full hover:bg-s-bg-sunken disabled:cursor-not-allowed ${CALENDAR_FOCUS}`}
                          />
                          {viewMode === "week" && (
                            <span
                              aria-hidden
                              className="pointer-events-none absolute left-1 top-0 text-xs tabular-nums text-s-ink-2"
                            >
                              {wall}
                            </span>
                          )}
                          {groups
                            .filter(
                              (group) =>
                                Math.floor(group.hitStart / 60) * 60 === minute,
                            )
                            .map((group, index) => {
                              const item = group.entries[0].item;
                              const grouped =
                                group.entries.length > 1 ||
                                (group.end - group.start) * pixelsPerMinute <
                                  44;
                              if (grouped)
                                return (
                                  <button
                                    key={item.id}
                                    data-calendar-group={group.entries
                                      .map((entry) => entry.item.id)
                                      .join(" ")}
                                    aria-label={group.entries
                                      .map((entry) => itemName(entry.item))
                                      .join("; ")}
                                    onClick={() =>
                                      setDetailGroup(
                                        group.entries.map(
                                          (entry) => entry.item,
                                        ),
                                      )
                                    }
                                    className={`absolute inset-x-0 z-10 overflow-hidden rounded-input px-2 text-left text-s-ink ${CALENDAR_FOCUS}`}
                                    style={{
                                      top:
                                        (group.hitStart - minute) *
                                        pixelsPerMinute,
                                      height:
                                        (group.hitEnd - group.hitStart) *
                                        pixelsPerMinute,
                                    }}
                                  >
                                    {group.entries.map((entry) => (
                                      <span
                                        key={entry.item.id}
                                        data-calendar-time-span={entry.item.id}
                                        aria-hidden
                                        className="pointer-events-none absolute inset-x-0 bg-s-bg-sunken"
                                        style={{
                                          top:
                                            (entry.start - group.hitStart) *
                                            pixelsPerMinute,
                                          height:
                                            (entry.end - entry.start) *
                                            pixelsPerMinute,
                                        }}
                                      />
                                    ))}
                                    <span className="relative block text-xs tabular-nums">
                                      {calendarTime(
                                        new Date(
                                          dayStart + group.start * 60000,
                                        ),
                                        locale,
                                      )}{" "}
                                      -{" "}
                                      {calendarTime(
                                        new Date(dayStart + group.end * 60000),
                                        locale,
                                      )}
                                    </span>
                                    <span className="relative block truncate text-sm font-semibold">
                                      {group.entries.length === 1
                                        ? item.label
                                        : t("detailsTitle")}
                                    </span>
                                  </button>
                                );
                              const { start, end } = group.entries[0];
                              return (
                                <Draggable
                                  key={item.id}
                                  draggableId={`${item.id}:${column.id}`}
                                  disableInteractiveElementBlocking
                                  index={index}
                                  isDragDisabled={
                                    !item.slot ||
                                    item.slot.status !== "available"
                                  }
                                >
                                  {(drag) => (
                                    <button
                                      ref={drag.innerRef}
                                      {...drag.draggableProps}
                                      {...drag.dragHandleProps}
                                      data-calendar-event={item.id}
                                      aria-label={itemName(item)}
                                      title={itemName(item)}
                                      onClick={() => openItem(item)}
                                      className={`absolute inset-x-0 z-10 overflow-hidden rounded-input bg-s-bg-sunken px-2 text-left text-s-ink ${item.status === "blocked" ? "border border-dashed border-s-border" : ""} ${CALENDAR_FOCUS}`}
                                      style={{
                                        top: (start - minute) * pixelsPerMinute,
                                        height: (end - start) * pixelsPerMinute,
                                        ...drag.draggableProps.style,
                                      }}
                                    >
                                      <span className="block truncate text-xs tabular-nums">
                                        {calendarTime(
                                          new Date(item.starts_at),
                                          locale,
                                        )}{" "}
                                        -{" "}
                                        {calendarTime(
                                          new Date(item.ends_at),
                                          locale,
                                        )}
                                      </span>
                                      <span className="block truncate text-sm font-semibold">
                                        {item.label}
                                      </span>
                                      {(end - start) * pixelsPerMinute >=
                                        64 && (
                                        <span className="block truncate text-sm text-s-ink-2">
                                          {item.service}
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </Draggable>
                              );
                            })}
                          <div className="hidden">{provided.placeholder}</div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DragDropContext onDragEnd={onDragEnd}>
        {createModal && salonId && (
          <SlotCreateModal
            date={createModal.date}
            startTime={createModal.time}
            initialStaffId={createModal.staffId}
            services={services}
            staff={staff}
            onClose={() => setCreateModal(null)}
            onCreated={loadSlots}
          />
        )}
        {bulkModal && salonId && (
          <BulkCreateModal
            services={services}
            staff={staff}
            salonId={salonId}
            onClose={() => setBulkModal(false)}
            onCreated={loadSlots}
          />
        )}
        {detailSlot && (
          <SlotDetailModal
            slot={detailSlot}
            staff={staffOptions}
            onClose={() => setDetailSlot(null)}
            onReschedule={rescheduleSlot}
            onDelete={deleteSlot}
          />
        )}
        {walkInModal && salonId && (
          <WalkInModal
            salonId={salonId}
            services={services}
            staff={staff}
            onClose={() => setWalkInModal(false)}
            onCreated={loadSlots}
          />
        )}
        {detailGroup && (
          <Modal
            isOpen
            onOpenChange={(open) => {
              if (!open) setDetailGroup(null);
            }}
            size="md"
          >
            <ModalHeader title={t("detailsTitle")} onClose={() => setDetailGroup(null)} closeAriaLabel={t("cancel")} />
            <ModalBody>{renderItemRows(detailGroup)}</ModalBody>
          </Modal>
        )}
        {detailBooking && (
          <Modal
            isOpen
            onOpenChange={(open) => {
              if (!open) setDetailBooking(null);
            }}
            size="sm"
          >
            <ModalHeader title={t("detailsTitle")} onClose={() => setDetailBooking(null)} closeAriaLabel={t("cancel")} />
            <ModalBody>
              <p className="text-sm font-semibold text-s-ink">
                {detailBooking.customer_name}
              </p>
              <p className="text-sm text-s-ink-2">
                {localizedField(detailBooking.services, "name", locale) ||
                  detailBooking.service_name}
              </p>
              <p className="text-sm text-s-ink-2">{detailBooking.staff_name}</p>
              <p className="mt-4 text-sm tabular-nums">
                {formatDate(new Date(detailBooking.starts_at), {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm tabular-nums">
                {calendarTime(new Date(detailBooking.starts_at), locale)} -{" "}
                {calendarTime(new Date(detailBooking.ends_at), locale)}
              </p>
            </ModalBody>
            <ModalFooter>
              <a
                href={`/${locale}/dashboard/bookings`}
                className={`inline-flex min-h-11 items-center rounded-btn bg-s-ink px-4 text-sm font-semibold text-white ${CALENDAR_FOCUS}`}
              >
                {t("manageBookings")}
              </a>
            </ModalFooter>
          </Modal>
        )}
        <div className="lg:hidden" data-calendar-mobile>
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() =>
                navigate(
                  mobileView === "monat"
                    ? "month"
                    : mobileView === "woche"
                      ? "week"
                      : "day",
                  -1,
                )
              }
              aria-label={t("previous")}
              className={`h-11 w-11 shrink-0 text-s-ink ${CALENDAR_FOCUS}`}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-0 flex-1 text-sm font-semibold text-s-ink">
              {dateLabel(mobileView === "monat" ? "month" : "day")}
            </span>
            <button
              onClick={today}
              className={`h-11 px-2 text-sm font-semibold text-s-ink ${CALENDAR_FOCUS}`}
            >
              {t("today")}
            </button>
            <button
              onClick={() =>
                navigate(
                  mobileView === "monat"
                    ? "month"
                    : mobileView === "woche"
                      ? "week"
                      : "day",
                  1,
                )
              }
              aria-label={t("next")}
              className={`h-11 w-11 shrink-0 text-s-ink ${CALENDAR_FOCUS}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="mb-4 flex overflow-hidden rounded-btn border border-s-border">
            {(
              [
                ["tag", "viewDay"],
                ["woche", "viewWeek"],
                ["monat", "viewMonth"],
              ] as const
            ).map(([mode, key]) => (
              <button
                key={mode}
                aria-pressed={mobileView === mode}
                onClick={() => setMobileView(mode)}
                className={`h-11 flex-1 text-sm ${mobileView === mode ? "bg-s-bg-sunken font-semibold text-s-ink" : "text-s-ink-2"} ${CALENDAR_FOCUS}`}
              >
                {t(key)}
              </button>
            ))}
          </div>
          <div className="mb-4">{staffSelect}</div>
          {mobileView !== "monat" && (
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {weekDays.map((day) => (
                <button
                  key={ymdLocal(day)}
                  onClick={() => setCurrentDate(day)}
                  aria-label={formatDate(day, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  aria-pressed={ymdLocal(day) === ymdLocal(currentDate)}
                  className={`min-h-11 min-w-11 rounded-btn border border-s-border px-2 py-2 text-xs tabular-nums ${ymdLocal(day) === ymdLocal(currentDate) ? "bg-s-bg-sunken font-semibold text-s-ink" : "text-s-ink-2"} ${CALENDAR_FOCUS}`}
                >
                  <span className="block">
                    {formatDate(day, { weekday: "short" })}
                  </span>
                  <span className="block text-sm">{day.getUTCDate()}</span>
                </button>
              ))}
            </div>
          )}
          {showSpinner ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : showError ? (
            errorState
          ) : mobileView === "monat" ? (
            renderMonth(true)
          ) : (
            renderAgenda()
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() =>
                setCreateModal({
                  date: ymdLocal(currentDate),
                  time: "09:00",
                  staffId:
                    staffFilter === "all" || staffFilter === "unassigned"
                      ? ""
                      : staffFilter,
                })
              }
              className={`h-11 flex-1 rounded-btn bg-s-ink px-4 text-sm font-semibold text-white ${CALENDAR_FOCUS}`}
            >
              {t("slot")}
            </button>
            <button
              onClick={() => setWalkInModal(true)}
              className={CALENDAR_CONTROL}
            >
              {t("walkIn")}
            </button>
            <button
              onClick={() => setBulkModal(true)}
              className={CALENDAR_CONTROL}
            >
              {t("plan")}
            </button>
          </div>
        </div>
        <div className="hidden lg:block" data-calendar-desktop>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {staffSelect}
              <button
                aria-label={t("previous")}
                onClick={() => navigate(viewMode, -1)}
                className={`${CALENDAR_CONTROL} w-11 !px-0`}
              >
                <ChevronLeft size={16} className="mx-auto" />
              </button>
              <button onClick={today} className={CALENDAR_CONTROL}>
                {t("today")}
              </button>
              <button
                aria-label={t("next")}
                onClick={() => navigate(viewMode, 1)}
                className={`${CALENDAR_CONTROL} w-11 !px-0`}
              >
                <ChevronRight size={16} className="mx-auto" />
              </button>
              <span className="text-sm font-semibold text-s-ink">
                {dateLabel(viewMode)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-btn border border-s-border">
                {(["day", "week", "month"] as const).map((mode) => (
                  <button
                    key={mode}
                    aria-pressed={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={`h-11 px-4 text-sm ${viewMode === mode ? "bg-s-bg-sunken font-semibold text-s-ink" : "text-s-ink-2"} ${CALENDAR_FOCUS}`}
                  >
                    {t(
                      mode === "day"
                        ? "viewDay"
                        : mode === "week"
                          ? "viewWeek"
                          : "viewMonth",
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setWalkInModal(true)}
                className={CALENDAR_CONTROL}
              >
                {t("walkIn")}
              </button>
              <button
                onClick={() => setBulkModal(true)}
                className={CALENDAR_CONTROL}
              >
                {t("plan")}
              </button>
              <button
                onClick={() =>
                  setCreateModal({
                    date: ymdLocal(currentDate),
                    time: "09:00",
                    staffId:
                      staffFilter === "all" || staffFilter === "unassigned"
                        ? ""
                        : staffFilter,
                  })
                }
                className={`inline-flex h-11 items-center gap-2 rounded-btn bg-s-ink px-4 text-sm font-semibold text-white ${CALENDAR_FOCUS}`}
              >
                <Plus size={16} />
                {t("add")}
              </button>
            </div>
          </div>
          {showSpinner ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : showError ? (
            errorState
          ) : viewMode === "month" ? (
            renderMonth(false)
          ) : (
            renderTimeline()
          )}
        </div>
      </DragDropContext>
    </DashboardLayout>
  );
}
