"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Plus, X, Lock, ArrowRight, Clock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { AvailabilitySlot } from "@/lib/types";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const HOURS = Array.from({ length: 25 }, (_, i) => i + 8); // 08:00–20:00 (24 half-hour rows = 12h)
const DAYS_LABEL = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

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
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-bold text-base">Slot erstellen</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>
        <p className="text-sm text-s-ink/50 mb-4">{date} um {startTime}</p>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Service *</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
              <option value="">Wählen…</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Mitarbeiter</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
              <option value="">Egal (wer verfügbar ist)</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-s-ink/10 text-sm text-s-ink/60">Abbrechen</button>
          <button onClick={handleCreate} disabled={!serviceId || loading}
            className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
      <div className="bg-white rounded-card shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-bold text-base">Wochenplan erstellen</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Service *</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
              <option value="">Wählen…</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Mitarbeiter</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
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
                      className={["w-9 text-center text-xs font-medium py-1.5 rounded-button transition-colors",
                        slot ? "bg-s-coral text-white" : "bg-s-bg-sunken text-s-ink/40"].join(" ")}>
                      {DAY_LABELS[i]}
                    </button>
                    {slot ? (
                      <>
                        <input type="time" value={slot.start} onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, start: e.target.value } }))}
                          className="px-2 py-1 rounded-button border border-s-ink/10 text-xs focus:outline-none focus:border-s-coral" />
                        <span className="text-xs text-s-ink/30">–</span>
                        <input type="time" value={slot.end} onChange={(e) => setTemplate((p) => ({ ...p, [key]: { ...slot, end: e.target.value } }))}
                          className="px-2 py-1 rounded-button border border-s-ink/10 text-xs focus:outline-none focus:border-s-coral" />
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
                  className={["flex-1 py-2 rounded-button border text-sm font-medium transition-colors",
                    weeks === w ? "bg-s-coral text-white border-s-coral" : "border-s-ink/10 text-s-ink/60"].join(" ")}>
                  {w} {w === 1 ? "Woche" : "Wochen"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-s-ink/10 text-sm text-s-ink/60">Abbrechen</button>
          <button onClick={handleCreate} disabled={!serviceId || loading}
            className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
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
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Neue Uhrzeit</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRescheduleMode(false)}
                className="flex-1 py-2.5 rounded-button border border-s-ink/10 text-sm text-s-ink/60">Zurück</button>
              <button onClick={handleReschedule} disabled={loading}
                className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1">
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
                  className="flex-1 py-2.5 rounded-button border border-s-coral text-s-coral text-sm font-medium flex items-center justify-center gap-1 hover:bg-s-coral/5 transition-colors">
                  <Clock size={14} /> Verschieben
                </button>
              )}
              <button onClick={() => { onDelete(slot.id); onClose(); }}
                className="flex-1 py-2.5 rounded-button border border-s-coral text-s-coral text-sm font-medium hover:bg-s-coral/5 transition-colors">
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
  "bg-purple-100 border-purple-300 text-purple-700",
  "bg-amber-100 border-amber-300 text-amber-700",
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
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [createModal, setCreateModal] = useState<{ date: string; time: string } | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [detailSlot, setDetailSlot] = useState<AvailabilitySlot | null>(null);
  const contextTarget = useRef<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStr = weekStart.toISOString().split("T")[0];

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
    }).catch(() => {});
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

  const slotBg = (s: AvailabilitySlot) => {
    if (s.status === "blocked") return "bg-s-bg-sunken border border-dashed border-gray-300";
    if (s.status === "booked") return "bg-s-ink text-white";
    if (s.price_override !== null) return "bg-s-coral border-2 border-s-coral"; // last-minute
    // Color by staff member
    if (s.staff_member_id && staffColorMap.has(s.staff_member_id)) {
      return staffColorMap.get(s.staff_member_id)! + " border";
    }
    return "bg-s-coral/15 border border-s-coral/30 text-s-coral";
  };

  return (
    <DashboardLayout>
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

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 rounded-button border border-s-ink/10 hover:border-s-coral transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-button border border-s-ink/10 text-sm hover:border-s-coral transition-colors">
            Heute
          </button>
          <button onClick={nextWeek} className="p-2 rounded-button border border-s-ink/10 hover:border-s-coral transition-colors">
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-medium text-s-ink ml-2">
            {weekStart.toLocaleDateString("de-CH", { day: "numeric", month: "long" })} –{" "}
            {addDays(weekStart, 6).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setBulkModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button border border-s-ink/10 text-sm text-s-ink/60 hover:border-s-coral hover:text-s-coral transition-colors">
            Wochenplan
          </button>
          <button onClick={() => setCreateModal({ date: new Date().toISOString().split("T")[0], time: "09:00" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-s-coral text-white text-sm font-medium">
            <Plus size={14} /> Slot
          </button>
        </div>
      </div>

      {/* Calendar grid — horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-card border border-s-ink/5 bg-white shadow-card">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-s-ink/5">
            <div className="py-3 px-2 text-xs text-s-ink/30" />
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              const dateStr = d.toISOString().split("T")[0];
              return (
                <div key={i} className="py-3 px-2 text-center border-l border-gray-50">
                  <p className={["text-xs font-medium", isToday ? "text-s-coral" : "text-s-ink/50"].join(" ")}>
                    {DAYS_LABEL[i]}
                  </p>
                  <p className={["text-sm font-bold mt-0.5", isToday ? "text-s-coral" : "text-s-ink"].join(" ")}>
                    {d.getDate()}
                  </p>
                  <button
                    onClick={() => blockDay(dateStr)}
                    title="Tag blockieren"
                    className="mt-1 w-4 h-4 flex items-center justify-center mx-auto text-s-ink/20 hover:text-s-coral transition-colors"
                  >
                    <Lock size={10} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Time rows */}
          {loading ? (
            <div className="flex justify-center py-10"><Spinner size="sm" /></div>
          ) : (
            Array.from({ length: 25 }, (_, rowIdx) => {
              const hour = rowIdx + 8;
              if (hour > 20) return null;
              return (
                <div key={hour} className="grid grid-cols-8 border-b border-gray-50 min-h-[40px]">
                  <div className="py-1 px-2 text-[10px] text-s-ink/30 text-right pr-3 pt-2">
                    {`${String(hour).padStart(2, "0")}:00`}
                  </div>
                  {weekDays.map((d, dayIdx) => {
                    const dateStr = d.toISOString().split("T")[0];
                    const cellSlots = slotForCell(dateStr, hour);
                    return (
                      <div
                        key={dayIdx}
                        className="border-l border-gray-50 p-0.5 cursor-pointer hover:bg-s-coral/5 transition-colors group"
                        onClick={() => setCreateModal({ date: dateStr, time: `${String(hour).padStart(2, "0")}:00` })}
                        onContextMenu={(e) => { e.preventDefault(); setCreateModal({ date: dateStr, time: `${String(hour).padStart(2, "0")}:00` }); }}
                      >
                        {cellSlots.map((s) => {
                          const staffMember = staff.find((st) => st.id === s.staff_member_id);
                          return (
                            <div
                              key={s.id}
                              onClick={(e) => { e.stopPropagation(); setDetailSlot(s); }}
                              className={["relative rounded text-[9px] px-1 py-0.5 mb-0.5 cursor-pointer group/slot", slotBg(s)].join(" ")}
                              title={staffMember ? staffMember.name : undefined}
                            >
                              {staffMember ? staffMember.name.split(" ")[0] : s.status === "booked" ? "Gebucht" : s.status === "blocked" ? "Blockiert" : "Frei"}
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteSlot(s.id); }}
                                className="absolute top-0 right-0 opacity-0 group-hover/slot:opacity-100 p-0.5 text-current"
                              >
                                <X size={8} />
                              </button>
                            </div>
                          );
                        })}
                        {cellSlots.length === 0 && (
                          <div className="opacity-0 group-hover:opacity-100 text-[9px] text-s-coral flex items-center justify-center h-full">
                            <Plus size={10} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-s-ink/40">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-coral/15 border border-s-coral/30" />Frei</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-ink" />Gebucht</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-bg-sunken border border-dashed border-gray-300" />Blockiert</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-s-coral border-2 border-s-coral" />Last-Minute</span>
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
    </DashboardLayout>
  );
}
