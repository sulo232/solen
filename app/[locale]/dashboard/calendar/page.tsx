"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, X, Lock, ArrowRight, Clock, UserPlus, CalendarX } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import ErrorState from "@/components-legacy/ui/ErrorState";
import WalkInModal from "@/components-legacy/dashboard/WalkInModal";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { AvailabilitySlot } from "@/lib/types";
import { resolveSwissLocale } from "@/lib/format";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

type ViewMode = "day" | "week" | "month";

const HOURS = Array.from({ length: 25 }, (_, i) => i + 8); // 08:00–20:00 (24 half-hour rows = 12h)
const DAYS_LABEL = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Service category → left border color
// V3-D347: vibrant service palette (LOCKFILE §12 calendar set).
const SERVICE_CATEGORY_COLORS: Record<string, string> = {
  hair: "border-l-4 border-l-s-cal-hair",
  nails: "border-l-4 border-l-s-cal-nails",
  spa: "border-l-4 border-l-s-cal-spa",
  barber: "border-l-4 border-l-s-cal-barber",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthCalendarDays(date: Date): Date[] {
  const first = startOfMonth(date);
  const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1; // Mon=0
  const start = addDays(first, -startDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(start, i));
  return days;
}

// Europe/Zurich YYYY-MM-DD, not the browser's ambient timezone. Salon owners operate
// in Switzerland; a browser/device set to another zone (a laptop left on UTC, a trip
// abroad) would otherwise shift "today" and every day bucket by a day near midnight.
// en-CA formats as YYYY-MM-DD.
const ZURICH_YMD_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function ymdLocal(d: Date): string {
  return ZURICH_YMD_FMT.format(d);
}

// ─────────────────────────────────────────
// Slot Create Modal
// ─────────────────────────────────────────

interface SlotModalProps {
  date: string;
  startTime: string;
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}

function SlotCreateModal({ date, startTime, services, staff, onClose, onCreated }: SlotModalProps) {
  const t = useTranslations("dashboard.calendarPage");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, start_time: startTime, service_id: serviceId, staff_member_id: staffId || null }),
      });
      onCreated();
      onClose();
      // V3-D334 (overnight T2): error handling per CLAUDE.md (was silent catch).
    } catch (err) { console.error("[Calendar] single slot create failed:", err); } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base">{t("createSlotTitle")}</h3>
          <button onClick={onClose}><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>
        <p className="text-sm text-s-ink-2 mb-4">{t("dateAtTime", { date, time: startTime })}</p>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("serviceRequired")}</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <option value="">{t("choosePlaceholder")}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("staffLabel")}</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <option value="">{t("anyStaffAvailable")}</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2">{t("cancel")}</button>
          <button onClick={handleCreate} disabled={!serviceId || loading}
            className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}{t("create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Bulk Create Modal
// ─────────────────────────────────────────

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function BulkCreateModal({ services, staff, salonId, onClose, onCreated }: {
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  salonId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations("dashboard.calendarPage");
  const [template, setTemplate] = useState<Record<string, { start: string; end: string } | null>>(
    Object.fromEntries(DAY_KEYS.map((k, i) => [k, i < 5 ? { start: "09:00", end: "18:00" } : null]))
  );
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [weeks, setWeeks] = useState<1 | 2 | 4>(2);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!serviceId) return;
    setLoading(true);
    try {
      await fetch("/api/slots/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, template, service_id: serviceId, staff_member_id: staffId || null, weeks }),
      });
      onCreated();
      onClose();
      // V3-D334 (overnight T2): error handling per CLAUDE.md (was silent catch).
    } catch (err) { console.error("[Calendar] bulk slot create failed:", err); } finally {
      setLoading(false);
    }
  };

  const toggleDay = (key: string) => {
    setTemplate((prev) => ({ ...prev, [key]: prev[key] ? null : { start: "09:00", end: "18:00" } }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base">{t("createWeekScheduleTitle")}</h3>
          <button onClick={onClose}><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("serviceRequired")}</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <option value="">{t("choosePlaceholder")}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("staffLabel")}</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <option value="">{t("anyStaff")}</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("scheduleLabel")}</label>
            <div className="space-y-2">
              {DAY_KEYS.map((key, i) => {
                const slot = template[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <button type="button" onClick={() => toggleDay(key)}
                      className={["w-9 text-center text-xs font-medium py-1.5 rounded-btn transition-colors", // mockup-ok: C2 fix, locked TabPill treatment (approved public/_mockups/fixes-refined)
                        slot ? "bg-s-bg-sunken text-s-ink font-semibold" : "bg-s-bg-sunken text-s-ink/40"].join(" ")}>
                      {DAY_LABELS[i]}
                    </button>
                    {slot ? (
                      <>
                        <input type="time" value={slot.start} onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, start: e.target.value } }))}
                          className="px-2 py-1 text-xs" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                        <span className="text-xs text-s-ink/30">-</span>
                        <input type="time" value={slot.end} onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, end: e.target.value } }))}
                          className="px-2 py-1 text-xs" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                      </>
                    ) : <span className="text-xs text-s-ink/30">{t("notAvailable")}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("weeksLabel")}</label>
            <div className="flex gap-2">
              {([1, 2, 4] as const).map((w) => (
                <button key={w} type="button" onClick={() => setWeeks(w)}
                  className={["flex-1 py-2 rounded-btn border text-sm font-medium transition-colors", // mockup-ok: C2 fix, locked TabPill treatment (approved public/_mockups/fixes-refined)
                    weeks === w ? "bg-s-bg-sunken text-s-ink font-semibold border-s-border" : "border-s-border text-s-ink-2"].join(" ")}>
                  {w} {w === 1 ? t("weekSingular") : t("weekPlural")}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2">{t("cancel")}</button>
          <button onClick={handleCreate} disabled={!serviceId || loading}
            className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}{t("create")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Slot Detail / Reschedule Modal
// ─────────────────────────────────────────

interface SlotDetailModalProps {
  slot: AvailabilitySlot;
  staff: { id: string; name: string }[];
  onClose: () => void;
  onReschedule: (slotId: string, newDate: string, newTime: string) => void;
  onDelete: (slotId: string) => void;
}

function SlotDetailModal({ slot, staff, onClose, onReschedule, onDelete }: SlotDetailModalProps) {
  const t = useTranslations("dashboard.calendarPage");
  const locale = useLocale();
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [newDate, setNewDate] = useState(slot.starts_at.split("T")[0]);
  const [newTime, setNewTime] = useState(new Date(slot.starts_at).toTimeString().slice(0, 5));
  const [loading, setLoading] = useState(false);

  const staffName = staff.find((s) => s.id === slot.staff_member_id)?.name || t("anyStaff");
  const startTime = new Date(slot.starts_at).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" });
  const endTime = new Date(slot.ends_at).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" });

  const handleReschedule = async () => {
    setLoading(true);
    try {
      onReschedule(slot.id, newDate, newTime);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base">
            {rescheduleMode ? t("rescheduleTitle") : t("detailsTitle")}
          </h3>
          <button onClick={onClose}><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>

        {rescheduleMode ? (
          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("newDate")}</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("newTime")}</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRescheduleMode(false)}
                className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2">{t("back")}</button>
              <button onClick={handleReschedule} disabled={loading}
                className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1">
                {loading && <Spinner size="sm" invert />}
                <ArrowRight size={14} strokeWidth={1.6} /> {t("reschedule")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-5 text-sm text-s-ink/70">
              <p><span className="text-s-ink/40">{t("statusLabel")}</span> <span className="font-medium">{slot.status === "booked" ? t("statusBooked") : slot.status === "blocked" ? t("statusBlocked") : t("statusFree")}</span></p>
              <p><span className="text-s-ink/40">{t("timeLabel")}</span> {startTime} - {endTime}</p>
              <p><span className="text-s-ink/40">{t("dateLabel")}</span> {new Date(slot.starts_at).toLocaleDateString(resolveSwissLocale(locale))}</p>
              <p><span className="text-s-ink/40">{t("staffDetailLabel")}</span> {staffName}</p>
            </div>
            <div className="flex gap-2">
              {slot.status !== "blocked" && (
                <button onClick={() => setRescheduleMode(true)}
                  className="flex-1 py-2.5 rounded-btn border border-s-accent-bright text-s-accent-bright text-sm font-medium flex items-center justify-center gap-1 hover:bg-s-accent-bright/5 transition-colors">
                  <Clock size={14} strokeWidth={1.6} /> {t("reschedule")}
                </button>
              )}
              <button onClick={() => { onDelete(slot.id); onClose(); }}
                className="flex-1 py-2.5 rounded-btn border border-s-accent-bright text-s-accent-bright text-sm font-medium hover:bg-s-accent-bright/5 transition-colors">
                {t("delete")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Staff color palette. Solid fills (mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15
// fixes-refined). The old low-opacity tints measured 1.13-1.9:1 against #F4F4F5,
// near-invisible in the legend swatch, and two entries ("coral"/"plum") were B&W
// aliases (V3-D332) so no opacity bump could ever fix them. Every entry below clears
// 3:1 (measured 4.57-6.46:1 vs #F4F4F5, 5.02-7.10:1 vs #FFFFFF). Raw Tailwind hues are
// intentional here: an 8-way staff-identity palette, not a semantic status/brand color,
// so s-error/s-success/s-warning/s-accent/s-ink do not have enough distinct hues for 8 staff.
const STAFF_COLORS = [
  "bg-rose-700 border-rose-800 text-white", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
  "bg-blue-700 border-blue-800 text-white", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
  "bg-violet-700 border-violet-800 text-white", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
  "bg-amber-700 border-amber-800 text-white", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
  "bg-pink-700 border-pink-800 text-white", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, mockup literal #BE185D
  "bg-emerald-700 border-emerald-800 text-white", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, mockup literal #047857
  "bg-orange-700 border-orange-800 text-white", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, mockup literal #C2410C
  "bg-cyan-700 border-cyan-800 text-white", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
];

// C1 punch fix: parallel LITERAL text-color array, same order/hues as STAFF_COLORS above, for the
// day-view staff header (text-on-white, not the solid swatch fill). Tailwind's scanner only
// generates CSS for class strings that appear verbatim in source; deriving "text-{hue}-700" at
// runtime via string replace never matches a literal, so the header rendered unstyled. Indexed
// directly instead.
const STAFF_TEXT_COLORS = [
  "text-rose-700", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
  "text-blue-700", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
  "text-violet-700", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
  "text-amber-700", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
  "text-pink-700", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, mockup literal #BE185D
  "text-emerald-700", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, mockup literal #047857
  "text-orange-700", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, mockup literal #C2410C
  "text-cyan-700", // mockup-ok drift-ok muted-ok: owner-approved C1 2026-07-15 fixes-refined, staff-identity hue
];

// ─────────────────────────────────────────
// Main Calendar
// ─────────────────────────────────────────

export default function CalendarPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.calendarPage");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  // Mobile-only view switch (Tag / Woche / Monat). Independent of the desktop `viewMode`.
  const [mobileView, setMobileView] = useState<"tag" | "woche" | "monat">("tag");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  // H2: a slot-fetch failure (vs. genuinely-empty) so we can render an error state w/ retry
  // instead of an indefinite spinner. null = no error.
  const [error, setError] = useState(false);
  // Tracks whether the /api/profile salon-resolution has SETTLED (success OR failure).
  // Until it has, we keep showing the spinner; once settled with no salonId, the views
  // render an error state (couldn't resolve this salon) rather than spinning forever.
  const [salonReady, setSalonReady] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [services, setServices] = useState<{ id: string; name: string; category?: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [createModal, setCreateModal] = useState<{ date: string; time: string } | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [detailSlot, setDetailSlot] = useState<AvailabilitySlot | null>(null);
  const [walkInModal, setWalkInModal] = useState(false);
  const contextTarget = useRef<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStr = ymdLocal(weekStart);

  // Build service category map for color-coded borders
  const serviceCategoryMap = new Map<string, string>();
  services.forEach((s) => { if (s.category) serviceCategoryMap.set(s.id, s.category); });

  const loadSlots = useCallback(async () => {
    // H2 fix: when there is no salon to load, STOP loading (don't early-return while
    // loading stays true, which was the day/week/month "spins forever" hang). The view
    // then renders an error state via the `salonReady && !salonId` branch.
    if (!salonId) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/slots?salon_id=${salonId}&week=${weekStr}`);
      if (!res.ok) throw new Error(`slots ${res.status}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
      // V3-D334 (overnight T2): error handling per CLAUDE.md.
    } catch (err) {
      console.error("[Calendar] loadSlots fetch failed:", err);
      setError(true);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [salonId, weekStr]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id ?? null);
        return Promise.all([
          fetch(`/api/services?salon_id=${p?.salon_id}`).then((r) => r.json()),
          fetch(`/api/staff?salon_id=${p?.salon_id}`).then((r) => r.json()),
        ]);
      })
      .then(([svcData, staffData]) => {
        setServices(svcData?.services ?? []);
        setStaff(staffData?.staff ?? []);
      })
      .catch((err) => console.error("[DashboardCalendar] failed to fetch profile/services/staff:", err))
      // Mark resolution settled either way so the views can leave the spinner state.
      .finally(() => setSalonReady(true));
  }, []);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  // Realtime slot updates
  useEffect(() => {
    if (!salonId) return;
    const supabase = createBrowserSupabaseClient();
    // Per-mount-UNIQUE topic: realtime-js channel() dedupes by topic and removeChannel() clears it
    // only after an async unsubscribe, so React Strict Mode's synchronous mount->cleanup->remount
    // hands a fixed topic back its still-subscribed channel, and .on(...) then throws "cannot add
    // postgres_changes callbacks ... after subscribe()". (The old "salon-slots" topic was also
    // salon-agnostic, so two tabs/salons collided too.) The salon_id filter carries the real scope.
    const channel = supabase
      .channel(`salon-slots-${salonId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "availability_slots", filter: `salon_id=eq.${salonId}` },
        () => loadSlots())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [salonId, loadSlots]);

  // Mobile Monat view: slot count per day (key = YYYY-MM-DD) for the dot grid.
  // The /api/slots endpoint only serves a single day or a 7-day `week` window,
  // so we fetch the ~6 Mondays that span the visible month grid and merge counts.
  // Reuses the endpoint as-is (no API change); degrades to no-dots on fetch error.
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (mobileView !== "monat" || !salonId) return;
    let cancelled = false;
    const gridDays = getMonthCalendarDays(currentDate); // 42 days (6 weeks)
    const mondays = Array.from(new Set(gridDays.map((d) => ymdLocal(startOfWeek(d)))));
    Promise.all(
      mondays.map((m) =>
        fetch(`/api/slots?salon_id=${salonId}&week=${m}`)
          .then((r) => r.json())
          .then((d) => (d.slots ?? []) as AvailabilitySlot[])
          .catch((err) => { console.error("[Calendar] month-range slot load failed:", err); return [] as AvailabilitySlot[]; })
      )
    ).then((weeks) => {
      if (cancelled) return;
      const counts: Record<string, number> = {};
      weeks.flat().forEach((s) => {
        const key = s.starts_at.split("T")[0];
        counts[key] = (counts[key] ?? 0) + 1;
      });
      setMonthCounts(counts);
    });
    return () => { cancelled = true; };
  }, [mobileView, salonId, currentDate]);

  const deleteSlot = async (id: string) => {
    await fetch(`/api/slots/${id}`, { method: "DELETE" });
    setSlots((prev) => prev.filter((s) => s.id !== id));
    loadSlots();
  };

  const rescheduleSlot = async (slotId: string, newDate: string, newTime: string) => {
    await fetch(`/api/slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, start_time: newTime }),
    });
    loadSlots();
  };

  // Map staff IDs to colors
  const staffColorMap = new Map<string, string>();
  staff.forEach((s, i) => staffColorMap.set(s.id, STAFF_COLORS[i % STAFF_COLORS.length]));

  const blockDay = async (dateStr: string) => {
    await fetch("/api/slots/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salonId, block_date: dateStr }),
    });
    loadSlots();
  };

  const slotForCell = (dayIso: string, hour: number) =>
    slots.filter((s) => s.starts_at.startsWith(dayIso) && new Date(s.starts_at).getHours() === hour);

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => setWeekStart(startOfWeek(new Date()));
  const goDay = (delta: number) => { const d = addDays(currentDate, delta); setCurrentDate(d); setWeekStart(startOfWeek(d)); };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const slotId = result.draggableId;
    const destId = result.destination.droppableId; // format: "YYYY-MM-DD:08:staffId"
    
    // Parse the dropzone ID
    const parts = destId.split(":");
    if (parts.length < 2) return;
    const dateStr = parts[0];
    const hourStr = parts[1];
    const newStaffId = parts[2];
    
    const newDate = new Date(`${dateStr}T${hourStr}:00:00`);
    const slotToMove = slots.find(s => s.id === slotId);
    if (!slotToMove) return;

    const startObj = new Date(slotToMove.starts_at);
    const endObj = new Date(slotToMove.ends_at);
    const durationMs = endObj.getTime() - startObj.getTime();
    
    const targetStart = newDate;
    const targetEnd = new Date(targetStart.getTime() + durationMs);
    const assignedStaff = newStaffId === "unassigned" ? null : (newStaffId || slotToMove.staff_member_id);

    // Optimistic UI update
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return {
          ...s,
          starts_at: targetStart.toISOString(),
          ends_at: targetEnd.toISOString(),
          staff_member_id: assignedStaff,
        };
      }
      return s;
    }));

    // Trigger API execution
    fetch(`/api/slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        starts_at: targetStart.toISOString(), 
        ends_at: targetEnd.toISOString(), 
        staff_member_id: assignedStaff 
      }),
    }).catch(() => loadSlots());
  };

  const slotBg = (s: AvailabilitySlot) => {
    // Service category left border
    const catBorder = s.service_id && serviceCategoryMap.has(s.service_id)
      ? SERVICE_CATEGORY_COLORS[serviceCategoryMap.get(s.service_id)!] ?? ""
      : "";

    if (s.status === "blocked") return `bg-s-bg-sunken border border-dashed border-s-border ${catBorder}`;
    if (s.status === "booked") return `bg-s-ink text-white ${catBorder}`;
    if (s.price_override !== null) return `bg-s-urgency-bg text-s-urgency border-2 border-s-urgency ${catBorder}`; // last-minute
    // Color by staff member
    if (s.staff_member_id && staffColorMap.has(s.staff_member_id)) {
      return staffColorMap.get(s.staff_member_id)! + ` border ${catBorder}`;
    }
    return `bg-s-accent-bright/15 border border-s-accent-bright/30 text-s-accent-bright ${catBorder}`;
  };

  // Mobile agenda block fill by service category (approved skin: pastel, no bars / no last-minute).
  const CAT_AGENDA_BG: Record<string, string> = {
    coiffeur: "bg-[#EAEFFE]", barbershop: "bg-[#FFEDD5]", nails: "bg-[#F3E8FF]", spa: "bg-[#E8F5E9]",
  };

  // H2 render decision (shared by mobile + every desktop view):
  //   1. show the spinner only while salon resolution is pending OR a slot fetch is in
  //      flight (both are bounded now: loadSlots always clears loading).
  //   2. show an error state with Retry when the slot fetch failed OR the salon couldn't
  //      be resolved (settled with no salonId). Never an indefinite spinner.
  // When there's simply no data, the grid itself is the empty affordance (clickable
  // cells), so no full-screen empty state replaces it.
  const showSpinner = !salonReady || loading;
  const showError = salonReady && (error || !salonId);
  // Retry covers both failure modes: if the salon is already resolved (slot fetch failed),
  // loadSlots() refetches directly; we also re-resolve the profile in case salonId was null,
  // which re-fires the loadSlots effect when the id changes.
  const retryCalendar = () => {
    setError(false);
    if (salonId) loadSlots();
    setSalonReady(false);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setSalonId(p?.salon_id ?? null))
      .catch((e) => console.error("[Calendar] retry profile failed:", e))
      .finally(() => setSalonReady(true));
  };
  const errorState = (
    <ErrorState
      icon={CalendarX}
      title={t("loadErrorTitle")}
      message={t("loadErrorMessage")}
      retryLabel={t("retry")}
      onRetry={retryCalendar}
    />
  );

  return (
    <DashboardLayout>
      <DragDropContext onDragEnd={onDragEnd}>
      {createModal && salonId && (
        <SlotCreateModal
          date={createModal.date}
          startTime={createModal.time}
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
          staff={staff}
          onClose={() => setDetailSlot(null)}
          onReschedule={rescheduleSlot}
          onDelete={deleteSlot}
        />
      )}

      {/* Walk-in modal */}
      {walkInModal && salonId && (
        <WalkInModal
          salonId={salonId}
          services={services}
          staff={staff}
          onClose={() => setWalkInModal(false)}
          onCreated={loadSlots}
        />
      )}

      {/* ═══ MOBILE (lg:hidden) — Tag / Woche / Monat in the approved skin ═══ */}
      <div className="lg:hidden">
        {(() => {
          // ── Agenda render (reused by Tag + Woche-selected-day). ──
          const renderAgenda = (forDate: Date) => {
            const dayIso = ymdLocal(forDate);
            const daySlots = slots.filter((s) => s.starts_at.startsWith(dayIso)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
            if (daySlots.length === 0) return <div className="text-center py-12 text-s-ink-2 text-sm">{t("noSlotsThisDay")}</div>;
            return (
              <div className="rounded-[16px] border border-s-border bg-white p-3 space-y-2">
                {daySlots.map((s) => {
                  const time = new Date(s.starts_at).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" });
                  const svc = services.find((sv) => sv.id === s.service_id)?.name;
                  const stf = staff.find((st) => st.id === s.staff_member_id)?.name?.split(" ")[0];
                  const cat = s.service_id ? serviceCategoryMap.get(s.service_id) : undefined;
                  let bg = "bg-[#EAEFFE]", lab = svc ?? t("statusBooked"), labCls = "text-s-ink";
                  let det: string | undefined = stf;
                  if (s.status === "blocked") { bg = "bg-s-bg-sunken"; lab = t("statusBlocked"); labCls = "text-s-ink-2"; det = undefined; }
                  else if (s.status === "available") { bg = "bg-s-success-bg"; lab = t("statusFree"); labCls = "text-s-success"; det = undefined; }
                  else { bg = (cat && CAT_AGENDA_BG[cat]) || "bg-[#EAEFFE]"; }
                  return (
                    <button key={s.id} onClick={() => setDetailSlot(s)} className="w-full flex items-stretch gap-3 text-left">
                      <span className="font-heading font-semibold text-[12px] text-s-ink-2 w-[40px] shrink-0 pt-3 tabular-nums">{time}</span>
                      <span className={`flex-1 rounded-[12px] px-3 py-2.5 min-h-[44px] flex flex-col justify-center ${bg}`}>
                        <span className={`font-heading font-semibold text-[13.5px] ${labCls}`}>{lab}</span>
                        {det && <span className="text-[12px] text-s-ink-2 mt-0.5">{det}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          };

          const isTodayDate = (d: Date) => d.toDateString() === new Date().toDateString();
          const goPrev = () => mobileView === "monat" ? (() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); })() : goDay(-1);
          const goNext = () => mobileView === "monat" ? (() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); })() : goDay(1);
          const goTodayMobile = () => { const t = new Date(); setCurrentDate(t); setWeekStart(startOfWeek(t)); };
          const headerLabel = mobileView === "monat"
            ? currentDate.toLocaleDateString(resolveSwissLocale(locale), { month: "long", year: "numeric" })
            : currentDate.toLocaleDateString(resolveSwissLocale(locale), { weekday: "long", day: "numeric", month: "long" });

          // Week strip days (Mon–Sun of the selected week).
          const stripDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate), i));

          return (
            <>
              {/* Header: chevrons + label + Heute */}
              <div className="flex items-center gap-2 mb-3">
                <button onClick={goPrev} aria-label={t("previous")} className="w-9 h-9 grid place-items-center text-s-ink"><ChevronLeft size={18} strokeWidth={1.9} /></button>
                <span className="flex-1 font-heading font-bold text-[17px] tracking-[-0.01em] text-s-ink">{headerLabel}</span>
                <button onClick={goTodayMobile} className="text-[12px] font-semibold text-s-accent">{t("today")}</button>
                <button onClick={goNext} aria-label={t("next")} className="w-9 h-9 grid place-items-center text-s-ink"><ChevronRight size={18} strokeWidth={1.9} /></button>
              </div>

              {/* Segmented control (Tag / Woche / Monat) */}
              <div className="flex bg-s-bg-sunken rounded-full p-[3px] gap-[2px] mb-3.5">
                {([["tag", t("viewDay")], ["woche", t("viewWeek")], ["monat", t("viewMonth")]] as const).map(([key, lab]) => (
                  <button key={key} onClick={() => setMobileView(key)}
                    className={["flex-1 font-heading font-semibold text-[12.5px] py-[7px] rounded-full transition-colors",
                      mobileView === key ? "bg-white text-s-ink shadow-[0_1px_3px_rgba(0,0,0,0.09)]" : "text-s-ink-2"].join(" ")}>
                    {lab}
                  </button>
                ))}
              </div>

              {/* Week date-strip (Tag shows it for context; Woche uses it to pick a day) */}
              {mobileView !== "monat" && (
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3.5">
                  {stripDays.map((d, i) => {
                    const dIso = ymdLocal(d);
                    const on = d.toDateString() === currentDate.toDateString();
                    const has = slots.some((s) => s.starts_at.startsWith(dIso));
                    return (
                      <button key={i} onClick={() => { setCurrentDate(d); setWeekStart(startOfWeek(d)); }}
                        className={["w-[46px] shrink-0 rounded-[13px] py-2 text-center border transition-colors",
                          on ? "bg-s-ink border-s-ink" : "bg-white border-s-border"].join(" ")}>
                        <div className={`text-[12px] font-semibold ${on ? "text-white/60" : "text-s-ink-2"}`}>{DAYS_LABEL[i].toUpperCase()}</div>
                        <div className={`font-heading font-bold text-[16px] mt-0.5 ${on ? "text-white" : "text-s-ink"}`}>{d.getDate()}</div>
                        {has
                          ? <div className={`w-[5px] h-[5px] rounded-full mx-auto mt-1 ${on ? "bg-white" : "bg-s-accent"}`} />
                          : <div className="h-[5px] mt-1" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Body by view */}
              {showSpinner ? (
                <div className="flex justify-center py-12"><Spinner size="lg" /></div>
              ) : showError ? (
                errorState
              ) : mobileView === "monat" ? (
                <div className="rounded-[16px] border border-s-border bg-white p-3.5">
                  <div className="grid grid-cols-7 gap-1">
                    {["M", "D", "M", "D", "F", "S", "S"].map((h, i) => (
                      <div key={i} className="text-[12px] text-s-ink-2 text-center font-semibold pb-1">{h}</div>
                    ))}
                    {getMonthCalendarDays(currentDate).map((d, i) => {
                      const dIso = ymdLocal(d);
                      const out = d.getMonth() !== currentDate.getMonth();
                      const today = isTodayDate(d);
                      const count = monthCounts[dIso] ?? 0;
                      const dots = Math.min(count, 3);
                      return (
                        <button key={i}
                          onClick={() => { setCurrentDate(d); setWeekStart(startOfWeek(d)); setMobileView("tag"); }}
                          className={["aspect-square rounded-[10px] flex flex-col items-center justify-center gap-[3px] font-heading font-semibold text-[12.5px] transition-colors",
                            today ? "bg-s-ink text-white" : out ? "bg-transparent text-s-ink-2" : "bg-s-bg-sunken text-s-ink"].join(" ")}>
                          {d.getDate()}
                          <span className="flex gap-[2px] h-1">
                            {Array.from({ length: dots }).map((_, k) => (
                              <i key={k} className={`w-1 h-1 rounded-full ${today ? "bg-white" : "bg-s-accent"}`} />
                            ))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                renderAgenda(currentDate)
              )}

              {/* Slot / Walk-in / Plan — unchanged, kept under the views */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setCreateModal({ date: ymdLocal(currentDate), time: "09:00" })} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-s-ink text-white font-heading font-semibold text-[13.5px] py-2.5"><Plus size={15} strokeWidth={1.9} /> {t("slot")}</button>
                <button onClick={() => setWalkInModal(true)} className="inline-flex items-center justify-center rounded-[12px] bg-white border border-s-border text-s-ink font-heading font-semibold text-[13.5px] px-4 py-2.5">{t("walkIn")}</button>
                <button onClick={() => setBulkModal(true)} className="inline-flex items-center justify-center rounded-[12px] bg-white border border-s-border text-s-ink font-heading font-semibold text-[13.5px] px-4 py-2.5">{t("plan")}</button>
              </div>
            </>
          );
        })()}
      </div>

      {/* ═══ DESKTOP (toolbar + grids + legend) — unchanged, lg+ only ═══ */}
      <div className="hidden lg:block">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (viewMode === "week") setWeekStart((w) => addDays(w, -7));
            else if (viewMode === "day") { setCurrentDate((d) => addDays(d, -1)); setWeekStart(startOfWeek(addDays(currentDate, -1))); }
            else { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); setWeekStart(startOfWeek(d)); }
          }} className="p-2 rounded-btn border border-s-border hover:border-s-accent-bright transition-colors">
            <ChevronLeft size={16} strokeWidth={1.9} className="text-s-ink" />
          </button>
          <button onClick={() => { const today = new Date(); setCurrentDate(today); setWeekStart(startOfWeek(today)); }}
            className="px-3 py-1.5 rounded-btn border border-s-border text-sm text-s-ink hover:border-s-accent-bright transition-colors">
            {t("today")}
          </button>
          <button onClick={() => {
            if (viewMode === "week") setWeekStart((w) => addDays(w, 7));
            else if (viewMode === "day") { setCurrentDate((d) => addDays(d, 1)); setWeekStart(startOfWeek(addDays(currentDate, 1))); }
            else { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); setWeekStart(startOfWeek(d)); }
          }} className="p-2 rounded-btn border border-s-border hover:border-s-accent-bright transition-colors">
            <ChevronRight size={16} strokeWidth={1.9} className="text-s-ink" />
          </button>
          <span className="text-sm font-medium text-s-ink ml-2">
            {viewMode === "day"
              ? currentDate.toLocaleDateString(resolveSwissLocale(locale), { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              : viewMode === "month"
              ? currentDate.toLocaleDateString(resolveSwissLocale(locale), { month: "long", year: "numeric" })
              : `${weekStart.toLocaleDateString(resolveSwissLocale(locale), { day: "numeric", month: "long" })} bis ${addDays(weekStart, 6).toLocaleDateString(resolveSwissLocale(locale), { day: "numeric", month: "long", year: "numeric" })}`
            }
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-btn border border-s-border overflow-hidden">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} // mockup-ok: C2 fix, locked TabPill treatment (approved public/_mockups/fixes-refined)
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode ? "bg-s-bg-sunken text-s-ink font-semibold" : "text-s-ink-2 hover:bg-s-accent-bright/5"}`}>
                {mode === "day" ? t("viewDay") : mode === "week" ? t("viewWeek") : t("viewMonth")}
              </button>
            ))}
          </div>
          <button onClick={() => setWalkInModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn border border-s-border text-sm text-s-ink-2 hover:border-s-accent-bright hover:text-s-accent-bright transition-colors">
            <UserPlus size={14} strokeWidth={1.6} /> {t("walkIn")}
          </button>
          <button onClick={() => setBulkModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn border border-s-border text-sm text-s-ink-2 hover:border-s-accent-bright hover:text-s-accent-bright transition-colors">
            {t("weekSchedule")}
          </button>
          <button onClick={() => setCreateModal({ date: ymdLocal(new Date()), time: "09:00" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-s-ink text-white text-sm font-medium">
            <Plus size={14} strokeWidth={1.6} /> {t("slot")}
          </button>
        </div>
      </div>

      {/* H2: couldn't resolve the salon or the slot fetch failed → one error state for the
          whole desktop view area (instead of an indefinite spinner inside each view). */}
      {showError && errorState}

      {/* ═══ WEEK VIEW ═══ */}
      {!showError && viewMode === "week" && (
        <div className="overflow-x-auto rounded-[12px] border border-s-ink/5 bg-white shadow-warm-md">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-8 border-b border-s-ink/5">
              <div className="py-3 px-2 text-xs text-s-ink/30" />
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                const dateStr = ymdLocal(d);
                return (
                  <div key={i} className="py-3 px-2 text-center border-l border-s-ink/5">
                    <p className={`text-xs font-medium ${isToday ? "text-s-accent-bright" : "text-s-ink-2"}`}>{DAYS_LABEL[i]}</p>
                    <button onClick={() => { setCurrentDate(d); setViewMode("day"); }}
                      className={`text-sm font-bold mt-0.5 hover:text-s-accent-bright transition-colors ${isToday ? "text-s-accent-bright" : "text-s-ink"}`}>
                      {d.getDate()}
                    </button>
                    <button onClick={() => blockDay(dateStr)} title={t("blockDay")}
                      className="mt-1 w-4 h-4 flex items-center justify-center mx-auto text-s-ink/20 hover:text-s-accent-bright transition-colors">
                      <Lock size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
            {showSpinner ? (
              <div className="flex justify-center py-10"><Spinner size="sm" /></div>
            ) : (
              Array.from({ length: 13 }, (_, rowIdx) => {
                const hour = rowIdx + 8;
                return (
                  <div key={hour} className="grid grid-cols-8 border-b border-s-ink/5 min-h-[40px]">
                    <div className="py-1 px-2 text-[12px] text-s-ink/30 text-right pr-3 pt-2">
                      {`${String(hour).padStart(2, "0")}:00`}
                    </div>
                    {weekDays.map((d, dayIdx) => {
                      const dateStr = ymdLocal(d);
                      const dropId = `${dateStr}:${String(hour).padStart(2, "0")}:unassigned`;
                      const cellSlots = slotForCell(dateStr, hour);
                      return (
                        <Droppable key={dayIdx} droppableId={dropId}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`border-l border-s-ink/5 p-0.5 cursor-pointer transition-colors group relative ${snapshot.isDraggingOver ? "bg-s-accent-bright/10" : "hover:bg-s-accent-bright/5"}`}
                              onClick={() => setCreateModal({ date: dateStr, time: `${String(hour).padStart(2, "0")}:00` })}>
                              {cellSlots.map((s, idx) => {
                                const staffMember = staff.find((st) => st.id === s.staff_member_id);
                                return (
                                  <Draggable key={s.id} draggableId={s.id} index={idx} isDragDisabled={s.status !== "available"}>
                                    {(dragProvided, dragSnapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        onClick={(e) => { e.stopPropagation(); setDetailSlot(s); }}
                                        className={`relative rounded text-[12px] px-1 py-0.5 mb-0.5 cursor-pointer group/slot ${slotBg(s)} ${dragSnapshot.isDragging ? "shadow-2xl z-50 scale-105" : ""}`}
                                        style={{ ...dragProvided.draggableProps.style }}
                                        title={staffMember ? staffMember.name : undefined}>
                                        {staffMember ? staffMember.name.split(" ")[0] : s.status === "booked" ? t("statusBooked") : s.status === "blocked" ? t("statusBlocked") : t("statusFree")}
                                        <button onClick={(e) => { e.stopPropagation(); deleteSlot(s.id); }}
                                          className="absolute top-0 right-0 opacity-100 md:opacity-0 group-hover/slot:md:opacity-100 p-0.5 text-current"><X size={8} /></button>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                              {cellSlots.length === 0 && !snapshot.isDraggingOver && (
                                <div className="opacity-100 md:opacity-0 group-hover:md:opacity-100 text-[12px] text-s-accent-bright absolute inset-0 flex items-center justify-center"><Plus size={10} /></div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══ DAY VIEW ═══ */}
      {!showError && viewMode === "day" && (
        <div className="rounded-[12px] border border-s-ink/5 bg-white shadow-warm-md">
          {/* Staff column headers */}
          <div className="grid border-b border-s-ink/5" style={{ gridTemplateColumns: `60px repeat(${Math.max(staff.length, 1)}, 1fr)` }}>
            <div className="py-3 px-2 text-xs text-s-ink/30" />
            {staff.length > 0 ? staff.map((s, i) => (
              <div key={s.id} className="py-3 px-2 text-center border-l border-s-ink/5">
                {/* mockup-ok: C1 punch fix, literal STAFF_TEXT_COLORS index (was a runtime-built "bg-".replace("text-") string that Tailwind's scanner never sees, so it compiled to nothing) */}
                <p className={`text-xs font-medium ${STAFF_TEXT_COLORS[i % STAFF_TEXT_COLORS.length]}`}>{s.name}</p>
              </div>
            )) : (
              <div className="py-3 px-2 text-center border-l border-s-ink/5">
                <p className="text-xs font-medium text-s-ink-2">{t("allStaff")}</p>
              </div>
            )}
          </div>
          {showSpinner ? (
            <div className="flex justify-center py-10"><Spinner size="sm" /></div>
          ) : (
            Array.from({ length: 13 }, (_, rowIdx) => {
              const hour = rowIdx + 8;
              const dateStr = ymdLocal(currentDate);
              return (
                <div key={hour} className="grid border-b border-s-ink/5 min-h-[48px]"
                  style={{ gridTemplateColumns: `60px repeat(${Math.max(staff.length, 1)}, 1fr)` }}>
                  <div className="py-1 px-2 text-[12px] text-s-ink/30 text-right pr-3 pt-2">
                    {`${String(hour).padStart(2, "0")}:00`}
                  </div>
                  {staff.length > 0 ? staff.map((staffMember) => {
                    const cellSlots = slots.filter((s) =>
                      s.starts_at.startsWith(dateStr) &&
                      new Date(s.starts_at).getHours() === hour &&
                      s.staff_member_id === staffMember.id
                    );
                    const dropId = `${dateStr}:${String(hour).padStart(2, "0")}:${staffMember.id}`;
                    return (
                      <Droppable key={staffMember.id} droppableId={dropId}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`border-l border-s-ink/5 p-0.5 cursor-pointer transition-colors group relative ${snapshot.isDraggingOver ? "bg-s-accent-bright/10" : "hover:bg-s-accent-bright/5"}`}
                            onClick={() => setCreateModal({ date: dateStr, time: `${String(hour).padStart(2, "0")}:00` })}>
                            {cellSlots.map((s, idx) => (
                              <Draggable key={s.id} draggableId={s.id} index={idx} isDragDisabled={s.status !== "available"}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={(e) => { e.stopPropagation(); setDetailSlot(s); }}
                                    className={`relative rounded text-[12px] px-1.5 py-1 mb-0.5 cursor-pointer group/slot ${slotBg(s)} ${dragSnapshot.isDragging ? "shadow-2xl z-50 scale-105" : ""}`}
                                    style={{ ...dragProvided.draggableProps.style }}>
                                    {s.status === "booked" ? t("statusBooked") : s.status === "blocked" ? t("statusBlocked") : t("statusFree")}
                                    <button onClick={(e) => { e.stopPropagation(); deleteSlot(s.id); }}
                                      className="absolute top-0 right-0 opacity-100 md:opacity-0 group-hover/slot:md:opacity-100 p-0.5 text-current"><X size={8} /></button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {cellSlots.length === 0 && !snapshot.isDraggingOver && (
                              <div className="opacity-100 md:opacity-0 group-hover:md:opacity-100 text-[12px] text-s-accent-bright absolute inset-0 flex items-center justify-center"><Plus size={10} /></div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    );
                  }) : (
                    <Droppable droppableId={`${dateStr}:${String(hour).padStart(2, "0")}:unassigned`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`border-l border-s-ink/5 p-0.5 cursor-pointer transition-colors group relative ${snapshot.isDraggingOver ? "bg-s-accent-bright/10" : "hover:bg-s-accent-bright/5"}`}
                          onClick={() => setCreateModal({ date: dateStr, time: `${String(hour).padStart(2, "0")}:00` })}>
                          {slotForCell(dateStr, hour).map((s, idx) => {
                            const sm = staff.find((st) => st.id === s.staff_member_id);
                            return (
                              <Draggable key={s.id} draggableId={s.id} index={idx} isDragDisabled={s.status !== "available"}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={(e) => { e.stopPropagation(); setDetailSlot(s); }}
                                    className={`relative rounded text-[12px] px-1.5 py-1 mb-0.5 cursor-pointer group/slot ${slotBg(s)} ${dragSnapshot.isDragging ? "shadow-2xl z-50 scale-105" : ""}`}
                                    style={{ ...dragProvided.draggableProps.style }}>
                                    {sm ? sm.name.split(" ")[0] : s.status === "booked" ? t("statusBooked") : t("statusFree")}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ MONTH VIEW ═══ */}
      {!showError && viewMode === "month" && (() => {
        const monthDays = getMonthCalendarDays(currentDate);
        const thisMonth = currentDate.getMonth();
        return (
          <div className="rounded-[12px] border border-s-ink/5 bg-white shadow-warm-md">
            <div className="grid grid-cols-7 border-b border-s-ink/5">
              {DAYS_LABEL.map((label) => (
                <div key={label} className="py-2 text-center text-xs font-medium text-s-ink-2">{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((d, i) => {
                const dateStr = ymdLocal(d);
                const isToday = d.toDateString() === new Date().toDateString();
                const isCurrentMonth = d.getMonth() === thisMonth;
                const daySlots = slots.filter((s) => s.starts_at.startsWith(dateStr));
                const bookedCount = daySlots.filter((s) => s.status === "booked").length;
                const availableCount = daySlots.filter((s) => s.status === "available").length;
                const blockedCount = daySlots.filter((s) => s.status === "blocked").length;
                return (
                  <div key={i}
                    onClick={() => { setCurrentDate(d); setViewMode("day"); }}
                    className={`min-h-[80px] p-1.5 border-b border-r border-s-ink/5 cursor-pointer hover:bg-s-accent-bright/5 transition-colors ${!isCurrentMonth ? "opacity-40" : ""}`}>
                    <p className={`text-xs font-medium mb-1 ${isToday ? "w-5 h-5 rounded-full bg-s-accent-bright text-white flex items-center justify-center" : "text-s-ink"}`}>
                      {d.getDate()}
                    </p>
                    {daySlots.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {bookedCount > 0 && <span className="w-2 h-2 rounded-full bg-s-ink" title={t("bookedCount", { count: bookedCount })} />}
                        {availableCount > 0 && <span className="w-2 h-2 rounded-full bg-s-accent-bright/40" title={t("availableCount", { count: availableCount })} />}
                        {blockedCount > 0 && <span className="w-2 h-2 rounded-full bg-s-ink/20" title={t("blockedCount", { count: blockedCount })} />}
                        {daySlots.length > 3 && <span className="text-[12px] text-s-ink/40">{daySlots.length}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-s-ink/40">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-accent-bright/15 border border-s-accent-bright/30" />{t("statusFree")}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-ink" />{t("statusBooked")}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-bg-sunken border border-dashed border-s-border" />{t("statusBlocked")}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-urgency-bg border-2 border-s-urgency" />{t("lastMinute")}</span>
        {/* Service category colors */}
        <span className="w-px h-4 bg-s-sand" />
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-l-4 border-l-s-accent-bright bg-s-accent-bright/10" />{t("categoryHair")}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-l-4 border-l-s-blue bg-s-blue/10" />{t("categoryNails")}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-l-4 border-l-s-sage bg-s-sage/10" />{t("categorySpa")}</span>
        {staff.length > 0 && (
          <>
            <span className="w-px h-4 bg-s-sand" />
            {staff.map((s, i) => (
              <span key={s.id} className="flex items-center gap-1.5">
                {/* mockup-ok: C1 fix, solid fill + initial letter so color is not the sole carrier (WCAG 1.4.1) */}
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold leading-none ${STAFF_COLORS[i % STAFF_COLORS.length]}`} title={s.name}> {/* drift-ok: single decorative glyph in a 16px identity swatch, matches owner-approved fixes-refined mockup literal */}
                  {s.name.charAt(0).toUpperCase()}
                </span>
                {s.name.split(" ")[0]}
              </span>
            ))}
          </>
        )}
      </div>
      </div>
      </DragDropContext>
    </DashboardLayout>
  );
}
