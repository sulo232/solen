"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, X, Lock, ArrowRight, Clock, UserPlus } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import WalkInModal from "@/components/dashboard/WalkInModal";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { AvailabilitySlot } from "@/lib/types";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

type ViewMode = "day" | "week" | "month";

const HOURS = Array.from({ length: 25 }, (_, i) => i + 8); // 08:00–20:00 (24 half-hour rows = 12h)
const DAYS_LABEL = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Service category → left border color
const SERVICE_CATEGORY_COLORS: Record<string, string> = {
  hair: "border-l-4 border-l-s-coral",
  nails: "border-l-4 border-l-s-blue",
  spa: "border-l-4 border-l-s-sage",
  makeup: "border-l-4 border-l-s-plum",
  barber: "border-l-4 border-l-s-amber",
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
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-bold text-base">Slot erstellen</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>
        <p className="text-sm text-s-ink/50 mb-4">{date} um {startTime}</p>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Service *</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
              <option value="">Wählen…</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Mitarbeiter</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
              <option value="">Egal (wer verfügbar ist)</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60">Abbrechen</button>
          <button onClick={handleCreate} disabled={!serviceId || loading}
            className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}Erstellen
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
    } catch { /* ignore */ } finally {
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
          <h3 className="font-heading font-bold text-base">Wochenplan erstellen</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Service *</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
              <option value="">Wählen…</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Mitarbeiter</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
              <option value="">Egal</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-2">Zeitplan</label>
            <div className="space-y-2">
              {DAY_KEYS.map((key, i) => {
                const slot = template[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <button type="button" onClick={() => toggleDay(key)}
                      className={["w-9 text-center text-xs font-medium py-1.5 rounded-btn transition-colors",
                        slot ? "bg-s-coral text-white" : "bg-s-bg-sunken text-s-ink/40"].join(" ")}>
                      {DAY_LABELS[i]}
                    </button>
                    {slot ? (
                      <>
                        <input type="time" value={slot.start} onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, start: e.target.value } }))}
                          className="px-2 py-1 rounded-btn border border-s-ink/10 text-xs focus:outline-none focus:border-s-coral" />
                        <span className="text-xs text-s-ink/30">–</span>
                        <input type="time" value={slot.end} onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, end: e.target.value } }))}
                          className="px-2 py-1 rounded-btn border border-s-ink/10 text-xs focus:outline-none focus:border-s-coral" />
                      </>
                    ) : <span className="text-xs text-s-ink/30">Nicht verfügbar</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-2">Wochen</label>
            <div className="flex gap-2">
              {([1, 2, 4] as const).map((w) => (
                <button key={w} type="button" onClick={() => setWeeks(w)}
                  className={["flex-1 py-2 rounded-btn border text-sm font-medium transition-colors",
                    weeks === w ? "bg-s-coral text-white border-s-coral" : "border-s-ink/10 text-s-ink/60"].join(" ")}>
                  {w} {w === 1 ? "Woche" : "Wochen"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60">Abbrechen</button>
          <button onClick={handleCreate} disabled={!serviceId || loading}
            className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}Erstellen
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
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [newDate, setNewDate] = useState(slot.starts_at.split("T")[0]);
  const [newTime, setNewTime] = useState(new Date(slot.starts_at).toTimeString().slice(0, 5));
  const [loading, setLoading] = useState(false);

  const staffName = staff.find((s) => s.id === slot.staff_member_id)?.name ?? "—";
  const startTime = new Date(slot.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  const endTime = new Date(slot.ends_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });

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
          <h3 className="font-heading font-bold text-base">
            {rescheduleMode ? "Termin verschieben" : "Termin-Details"}
          </h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>

        {rescheduleMode ? (
          <div className="space-y-3 mb-5">
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Neues Datum</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Neue Uhrzeit</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRescheduleMode(false)}
                className="flex-1 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60">Zurück</button>
              <button onClick={handleReschedule} disabled={loading}
                className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1">
                {loading && <Spinner size="sm" invert />}
                <ArrowRight size={14} /> Verschieben
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-5 text-sm text-s-ink/70">
              <p><span className="text-s-ink/40">Status:</span> <span className="font-medium">{slot.status === "booked" ? "Gebucht" : slot.status === "blocked" ? "Blockiert" : "Frei"}</span></p>
              <p><span className="text-s-ink/40">Zeit:</span> {startTime} – {endTime}</p>
              <p><span className="text-s-ink/40">Datum:</span> {new Date(slot.starts_at).toLocaleDateString("de-CH")}</p>
              <p><span className="text-s-ink/40">Mitarbeiter:</span> {staffName}</p>
            </div>
            <div className="flex gap-2">
              {slot.status !== "blocked" && (
                <button onClick={() => setRescheduleMode(true)}
                  className="flex-1 py-2.5 rounded-btn border border-s-coral text-s-coral text-sm font-medium flex items-center justify-center gap-1 hover:bg-s-coral/5 transition-colors">
                  <Clock size={14} /> Verschieben
                </button>
              )}
              <button onClick={() => { onDelete(slot.id); onClose(); }}
                className="flex-1 py-2.5 rounded-btn border border-s-coral text-s-coral text-sm font-medium hover:bg-s-coral/5 transition-colors">
                Löschen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Staff color palette
const STAFF_COLORS = [
  "bg-s-coral/15 border-s-coral/30 text-s-coral",
  "bg-blue-100 border-blue-300 text-blue-700",
  "bg-s-plum/10 border-s-plum/30 text-s-plum",
  "bg-s-amber-subtle border-s-amber/30 text-s-amber-text",
  "bg-pink-100 border-pink-300 text-pink-700",
  "bg-emerald-100 border-emerald-300 text-emerald-700",
  "bg-orange-100 border-orange-300 text-orange-700",
  "bg-cyan-100 border-cyan-300 text-cyan-700",
];

// ─────────────────────────────────────────
// Main Calendar
// ─────────────────────────────────────────

export default function CalendarPage() {
  const locale = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [services, setServices] = useState<{ id: string; name: string; category?: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [createModal, setCreateModal] = useState<{ date: string; time: string } | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [detailSlot, setDetailSlot] = useState<AvailabilitySlot | null>(null);
  const [walkInModal, setWalkInModal] = useState(false);
  const contextTarget = useRef<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStr = weekStart.toISOString().split("T")[0];

  // Build service category map for color-coded borders
  const serviceCategoryMap = new Map<string, string>();
  services.forEach((s) => { if (s.category) serviceCategoryMap.set(s.id, s.category); });

  const loadSlots = useCallback(async () => {
    if (!salonId) return;
    setLoading(true);
    try {
      const data = await fetch(`/api/slots?salon_id=${salonId}&week=${weekStr}`).then((r) => r.json());
      setSlots(data.slots ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [salonId, weekStr]);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      setSalonId(p?.salon_id ?? null);
      return Promise.all([
        fetch(`/api/services?salon_id=${p?.salon_id}`).then((r) => r.json()),
        fetch(`/api/staff?salon_id=${p?.salon_id}`).then((r) => r.json()),
      ]);
    }).then(([svcData, staffData]) => {
      setServices(svcData?.services ?? []);
      setStaff(staffData?.staff ?? []);
    }).catch((err) => console.error("[DashboardCalendar] failed to fetch services or staff:", err));
  }, []);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  // Realtime slot updates
  useEffect(() => {
    if (!salonId) return;
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("salon-slots")
      .on("postgres_changes", { event: "*", schema: "public", table: "availability_slots", filter: `salon_id=eq.${salonId}` },
        () => loadSlots())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [salonId, loadSlots]);

  const deleteSlot = async (id: string) => {
    await fetch(`/api/slots/${id}`, { method: "DELETE" });
    setSlots((prev) => prev.filter((s) => s.id !== id));
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

    if (s.status === "blocked") return `bg-s-bg-sunken border border-dashed border-s-ink/20 ${catBorder}`;
    if (s.status === "booked") return `bg-s-ink text-white ${catBorder}`;
    if (s.price_override !== null) return `bg-s-coral border-2 border-s-coral ${catBorder}`; // last-minute
    // Color by staff member
    if (s.staff_member_id && staffColorMap.has(s.staff_member_id)) {
      return staffColorMap.get(s.staff_member_id)! + ` border ${catBorder}`;
    }
    return `bg-s-coral/15 border border-s-coral/30 text-s-coral ${catBorder}`;
  };

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

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (viewMode === "week") setWeekStart((w) => addDays(w, -7));
            else if (viewMode === "day") { setCurrentDate((d) => addDays(d, -1)); setWeekStart(startOfWeek(addDays(currentDate, -1))); }
            else { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); setWeekStart(startOfWeek(d)); }
          }} className="p-2 rounded-btn border border-s-ink/10 dark:border-white/10 hover:border-s-coral transition-colors">
            <ChevronLeft size={16} className="text-s-ink dark:text-s-dm-text" />
          </button>
          <button onClick={() => { const today = new Date(); setCurrentDate(today); setWeekStart(startOfWeek(today)); }}
            className="px-3 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text hover:border-s-coral transition-colors">
            Heute
          </button>
          <button onClick={() => {
            if (viewMode === "week") setWeekStart((w) => addDays(w, 7));
            else if (viewMode === "day") { setCurrentDate((d) => addDays(d, 1)); setWeekStart(startOfWeek(addDays(currentDate, 1))); }
            else { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); setWeekStart(startOfWeek(d)); }
          }} className="p-2 rounded-btn border border-s-ink/10 dark:border-white/10 hover:border-s-coral transition-colors">
            <ChevronRight size={16} className="text-s-ink dark:text-s-dm-text" />
          </button>
          <span className="text-sm font-medium text-s-ink dark:text-s-dm-text ml-2">
            {viewMode === "day"
              ? currentDate.toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              : viewMode === "month"
              ? currentDate.toLocaleDateString("de-CH", { month: "long", year: "numeric" })
              : `${weekStart.toLocaleDateString("de-CH", { day: "numeric", month: "long" })} – ${addDays(weekStart, 6).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}`
            }
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-btn border border-s-ink/10 dark:border-white/10 overflow-hidden">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === mode ? "bg-s-coral text-white" : "text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-coral/5"}`}>
                {mode === "day" ? "Tag" : mode === "week" ? "Woche" : "Monat"}
              </button>
            ))}
          </div>
          <button onClick={() => setWalkInModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral hover:text-s-coral transition-colors">
            <UserPlus size={14} /> Walk-in
          </button>
          <button onClick={() => setBulkModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral hover:text-s-coral transition-colors">
            Wochenplan
          </button>
          <button onClick={() => setCreateModal({ date: new Date().toISOString().split("T")[0], time: "09:00" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-s-coral text-white text-sm font-medium">
            <Plus size={14} /> Slot
          </button>
        </div>
      </div>

      {/* ═══ WEEK VIEW ═══ */}
      {viewMode === "week" && (
        <div className="overflow-x-auto rounded-[12px] border border-s-ink/5 dark:border-white/5 bg-white dark:bg-s-dm-surface shadow-warm-md">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-8 border-b border-s-ink/5 dark:border-white/5">
              <div className="py-3 px-2 text-xs text-s-ink/30 dark:text-s-dm-text/30" />
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                const dateStr = d.toISOString().split("T")[0];
                return (
                  <div key={i} className="py-3 px-2 text-center border-l border-s-ink/5 dark:border-white/5">
                    <p className={`text-xs font-medium ${isToday ? "text-s-coral" : "text-s-ink/50 dark:text-s-dm-text/50"}`}>{DAYS_LABEL[i]}</p>
                    <button onClick={() => { setCurrentDate(d); setViewMode("day"); }}
                      className={`text-sm font-bold mt-0.5 hover:text-s-coral transition-colors ${isToday ? "text-s-coral" : "text-s-ink dark:text-s-dm-text"}`}>
                      {d.getDate()}
                    </button>
                    <button onClick={() => blockDay(dateStr)} title="Tag blockieren"
                      className="mt-1 w-4 h-4 flex items-center justify-center mx-auto text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-coral transition-colors">
                      <Lock size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Spinner size="sm" /></div>
            ) : (
              Array.from({ length: 13 }, (_, rowIdx) => {
                const hour = rowIdx + 8;
                return (
                  <div key={hour} className="grid grid-cols-8 border-b border-s-ink/5 dark:border-white/5 min-h-[40px]">
                    <div className="py-1 px-2 text-[10px] text-s-ink/30 dark:text-s-dm-text/30 text-right pr-3 pt-2">
                      {`${String(hour).padStart(2, "0")}:00`}
                    </div>
                    {weekDays.map((d, dayIdx) => {
                      const dateStr = d.toISOString().split("T")[0];
                      const dropId = `${dateStr}:${String(hour).padStart(2, "0")}:unassigned`;
                      const cellSlots = slotForCell(dateStr, hour);
                      return (
                        <Droppable key={dayIdx} droppableId={dropId}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`border-l border-s-ink/5 dark:border-white/5 p-0.5 cursor-pointer transition-colors group relative ${snapshot.isDraggingOver ? "bg-s-coral/10" : "hover:bg-s-coral/5"}`}
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
                                        className={`relative rounded text-[9px] px-1 py-0.5 mb-0.5 cursor-pointer group/slot ${slotBg(s)} ${dragSnapshot.isDragging ? "shadow-2xl z-50 scale-105" : ""}`}
                                        style={{ ...dragProvided.draggableProps.style }}
                                        title={staffMember ? staffMember.name : undefined}>
                                        {staffMember ? staffMember.name.split(" ")[0] : s.status === "booked" ? "Gebucht" : s.status === "blocked" ? "Blockiert" : "Frei"}
                                        <button onClick={(e) => { e.stopPropagation(); deleteSlot(s.id); }}
                                          className="absolute top-0 right-0 opacity-0 group-hover/slot:opacity-100 p-0.5 text-current"><X size={8} /></button>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                              {cellSlots.length === 0 && !snapshot.isDraggingOver && (
                                <div className="opacity-0 group-hover:opacity-100 text-[9px] text-s-coral absolute inset-0 flex items-center justify-center"><Plus size={10} /></div>
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
      {viewMode === "day" && (
        <div className="rounded-[12px] border border-s-ink/5 dark:border-white/5 bg-white dark:bg-s-dm-surface shadow-warm-md">
          {/* Staff column headers */}
          <div className="grid border-b border-s-ink/5 dark:border-white/5" style={{ gridTemplateColumns: `60px repeat(${Math.max(staff.length, 1)}, 1fr)` }}>
            <div className="py-3 px-2 text-xs text-s-ink/30 dark:text-s-dm-text/30" />
            {staff.length > 0 ? staff.map((s, i) => (
              <div key={s.id} className="py-3 px-2 text-center border-l border-s-ink/5 dark:border-white/5">
                <p className={`text-xs font-medium ${STAFF_COLORS[i % STAFF_COLORS.length].split(" ")[2]}`}>{s.name}</p>
              </div>
            )) : (
              <div className="py-3 px-2 text-center border-l border-s-ink/5 dark:border-white/5">
                <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">Alle</p>
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner size="sm" /></div>
          ) : (
            Array.from({ length: 13 }, (_, rowIdx) => {
              const hour = rowIdx + 8;
              const dateStr = currentDate.toISOString().split("T")[0];
              return (
                <div key={hour} className="grid border-b border-s-ink/5 dark:border-white/5 min-h-[48px]"
                  style={{ gridTemplateColumns: `60px repeat(${Math.max(staff.length, 1)}, 1fr)` }}>
                  <div className="py-1 px-2 text-[10px] text-s-ink/30 dark:text-s-dm-text/30 text-right pr-3 pt-2">
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
                            className={`border-l border-s-ink/5 dark:border-white/5 p-0.5 cursor-pointer transition-colors group relative ${snapshot.isDraggingOver ? "bg-s-coral/10" : "hover:bg-s-coral/5"}`}
                            onClick={() => setCreateModal({ date: dateStr, time: `${String(hour).padStart(2, "0")}:00` })}>
                            {cellSlots.map((s, idx) => (
                              <Draggable key={s.id} draggableId={s.id} index={idx} isDragDisabled={s.status !== "available"}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={(e) => { e.stopPropagation(); setDetailSlot(s); }}
                                    className={`relative rounded text-[10px] px-1.5 py-1 mb-0.5 cursor-pointer group/slot ${slotBg(s)} ${dragSnapshot.isDragging ? "shadow-2xl z-50 scale-105" : ""}`}
                                    style={{ ...dragProvided.draggableProps.style }}>
                                    {s.status === "booked" ? "Gebucht" : s.status === "blocked" ? "Blockiert" : "Frei"}
                                    <button onClick={(e) => { e.stopPropagation(); deleteSlot(s.id); }}
                                      className="absolute top-0 right-0 opacity-0 group-hover/slot:opacity-100 p-0.5 text-current"><X size={8} /></button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {cellSlots.length === 0 && !snapshot.isDraggingOver && (
                              <div className="opacity-0 group-hover:opacity-100 text-[9px] text-s-coral absolute inset-0 flex items-center justify-center"><Plus size={10} /></div>
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
                          className={`border-l border-s-ink/5 dark:border-white/5 p-0.5 cursor-pointer transition-colors group relative ${snapshot.isDraggingOver ? "bg-s-coral/10" : "hover:bg-s-coral/5"}`}
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
                                    className={`relative rounded text-[10px] px-1.5 py-1 mb-0.5 cursor-pointer group/slot ${slotBg(s)} ${dragSnapshot.isDragging ? "shadow-2xl z-50 scale-105" : ""}`}
                                    style={{ ...dragProvided.draggableProps.style }}>
                                    {sm ? sm.name.split(" ")[0] : s.status === "booked" ? "Gebucht" : "Frei"}
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
      {viewMode === "month" && (() => {
        const monthDays = getMonthCalendarDays(currentDate);
        const thisMonth = currentDate.getMonth();
        return (
          <div className="rounded-[12px] border border-s-ink/5 dark:border-white/5 bg-white dark:bg-s-dm-surface shadow-warm-md">
            <div className="grid grid-cols-7 border-b border-s-ink/5 dark:border-white/5">
              {DAYS_LABEL.map((label) => (
                <div key={label} className="py-2 text-center text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((d, i) => {
                const dateStr = d.toISOString().split("T")[0];
                const isToday = d.toDateString() === new Date().toDateString();
                const isCurrentMonth = d.getMonth() === thisMonth;
                const daySlots = slots.filter((s) => s.starts_at.startsWith(dateStr));
                const bookedCount = daySlots.filter((s) => s.status === "booked").length;
                const availableCount = daySlots.filter((s) => s.status === "available").length;
                const blockedCount = daySlots.filter((s) => s.status === "blocked").length;
                return (
                  <div key={i}
                    onClick={() => { setCurrentDate(d); setViewMode("day"); }}
                    className={`min-h-[80px] p-1.5 border-b border-r border-s-ink/5 dark:border-white/5 cursor-pointer hover:bg-s-coral/5 transition-colors ${!isCurrentMonth ? "opacity-40" : ""}`}>
                    <p className={`text-xs font-medium mb-1 ${isToday ? "w-5 h-5 rounded-full bg-s-coral text-white flex items-center justify-center" : "text-s-ink dark:text-s-dm-text"}`}>
                      {d.getDate()}
                    </p>
                    {daySlots.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {bookedCount > 0 && <span className="w-2 h-2 rounded-full bg-s-ink dark:bg-s-dm-text" title={`${bookedCount} gebucht`} />}
                        {availableCount > 0 && <span className="w-2 h-2 rounded-full bg-s-coral/40" title={`${availableCount} frei`} />}
                        {blockedCount > 0 && <span className="w-2 h-2 rounded-full bg-s-ink/20 dark:bg-s-dm-text/20" title={`${blockedCount} blockiert`} />}
                        {daySlots.length > 3 && <span className="text-[8px] text-s-ink/40 dark:text-s-dm-text/40">{daySlots.length}</span>}
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
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-s-ink/40 dark:text-s-dm-text/40">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-coral/15 border border-s-coral/30" />Frei</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-ink dark:bg-s-dm-text" />Gebucht</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-bg-sunken border border-dashed border-s-ink/20" />Blockiert</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-coral border-2 border-s-coral" />Last-Minute</span>
        {/* Service category colors */}
        <span className="w-px h-4 bg-s-sand" />
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-l-4 border-l-s-coral bg-s-coral/10" />Hair</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-l-4 border-l-s-blue bg-s-blue/10" />Nails</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-l-4 border-l-s-sage bg-s-sage/10" />Spa</span>
        {staff.length > 0 && (
          <>
            <span className="w-px h-4 bg-s-sand" />
            {staff.map((s, i) => (
              <span key={s.id} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded border ${STAFF_COLORS[i % STAFF_COLORS.length].split(" ").slice(0, 2).join(" ")}`} />
                {s.name.split(" ")[0]}
              </span>
            ))}
          </>
        )}
      </div>
      </DragDropContext>
    </DashboardLayout>
  );
}
