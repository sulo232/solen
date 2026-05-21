"use client";

import { useState, useEffect } from "react";
import { DoorOpen, Plus, Save, Trash2, X, Edit3 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Room {
  id: string;
  name: string;
  room_type: string;
  capacity: number;
  prep_buffer_minutes: number;
  cooldown_buffer_minutes: number;
  equipment: string[];
  is_active: boolean;
  sort_order: number;
}

const ROOM_TYPES = ["treatment", "sauna", "pool", "steam"] as const;
const EQUIPMENT_OPTIONS = [
  "massage_table", "hot_stones", "steam_unit", "infrared_lamp",
  "aromatherapy", "sound_system", "shower", "whirlpool",
];

export default function RoomManager({ salonId }: { salonId: string }) {
  const t = useTranslations("dashboardSpa") as any;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    room_type: "treatment" as string,
    capacity: 1,
    prep_buffer_minutes: 15,
    cooldown_buffer_minutes: 10,
    equipment: [] as string[],
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/dashboard/spa/rooms");
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled) setRooms(d.data ?? []);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [salonId]);

  const resetForm = () => {
    setForm({ name: "", room_type: "treatment", capacity: 1, prep_buffer_minutes: 15, cooldown_buffer_minutes: 10, equipment: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (room: Room) => {
    setForm({
      name: room.name,
      room_type: room.room_type,
      capacity: room.capacity,
      prep_buffer_minutes: room.prep_buffer_minutes,
      cooldown_buffer_minutes: room.cooldown_buffer_minutes,
      equipment: room.equipment ?? [],
    });
    setEditingId(room.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/dashboard/spa/rooms?id=${editingId}`
        : "/api/dashboard/spa/rooms";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (editingId) {
          setRooms((prev) => prev.map((r) => (r.id === editingId ? data : r)));
        } else {
          setRooms((prev) => [...prev, data]);
        }
        resetForm();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/spa/rooms?id=${id}`, { method: "DELETE" });
      if (res.ok) setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const toggleEquipment = (item: string) => {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter((e) => e !== item)
        : [...prev.equipment, item],
    }));
  };

  if (loading) return <p className="text-sm text-s-ink/40 py-4">{t("loading")}</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DoorOpen size={16} className="text-s-coral" />
          <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-amber">
            {t("treatment_rooms")}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            aria-label={t("add_room")}
            className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors duration-150"
          >
            <Plus size={14} /> {t("add_room")}
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-[--raised] space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-heading text-s-ink">
              {editingId ? t("edit_room") : t("new_room")}
            </p>
            <button onClick={resetForm} aria-label={t("cancel")} className="text-s-ink/30 hover:text-s-ink transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/50 block mb-1">
              {t("room_name")}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              aria-label={t("room_name")}
              className="w-full rounded-[8px] border border-s-ink/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            />
          </div>

          {/* Type + Capacity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/50 block mb-1">
                {t("room_type_label")}
              </label>
              <select
                value={form.room_type}
                onChange={(e) => setForm((p) => ({ ...p, room_type: e.target.value }))}
                aria-label={t("room_type_label")}
                className="w-full rounded-[8px] border border-s-ink/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              >
                {ROOM_TYPES.map((rt) => (
                  <option key={rt} value={rt}>{t(`room_type.${rt}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/50 block mb-1">
                {t("capacity")}
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 1 }))}
                aria-label={t("capacity")}
                className="w-full rounded-[8px] border border-s-ink/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              />
            </div>
          </div>

          {/* Buffers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/50 block mb-1">
                {t("prep_buffer")}
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={form.prep_buffer_minutes}
                onChange={(e) => setForm((p) => ({ ...p, prep_buffer_minutes: parseInt(e.target.value) || 0 }))}
                aria-label={t("prep_buffer")}
                className="w-full rounded-[8px] border border-s-ink/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/50 block mb-1">
                {t("cooldown_buffer")}
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={form.cooldown_buffer_minutes}
                onChange={(e) => setForm((p) => ({ ...p, cooldown_buffer_minutes: parseInt(e.target.value) || 0 }))}
                aria-label={t("cooldown_buffer")}
                className="w-full rounded-[8px] border border-s-ink/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              />
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/50 block mb-2">
              {t("equipment")}
            </label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  aria-label={t(`equipment_item.${eq}` as any)}
                  aria-pressed={form.equipment.includes(eq)}
                  className={`px-2.5 py-1 rounded-[8px] text-[10px] font-heading uppercase tracking-[.06em] transition-colors duration-150 ${
                    form.equipment.includes(eq)
                      ? "bg-s-coral text-white"
                      : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
                  }`}
                >
                  {t(`equipment_item.${eq}` as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={resetForm}
              aria-label={t("cancel")}
              className="px-3 py-1.5 rounded-[8px] border border-s-ink/10 text-xs text-s-ink/60 transition-colors duration-150"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              aria-label={t("save")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-pill bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-elevation-2"
            >
              <Save size={12} />
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      )}

      {/* Room List */}
      {rooms.length === 0 && !showForm ? (
        <div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-6 text-center bg-[--raised]">
          <DoorOpen size={20} className="mx-auto mb-2 text-s-ink/20" />
          <p className="text-xs text-s-ink/30">{t("no_rooms")}</p>
        </div>
      ) : (
        <div className="rounded-[12px] border border-s-ink/[0.06] bg-[--raised] overflow-hidden">
          {rooms.map((room, i) => {
            const utilization = 0; // Placeholder — real utilization requires booking query
            return (
              <div
                key={room.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < rooms.length - 1 ? "border-b border-s-ink/[0.04]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading text-s-ink truncate">
                    {room.name}
                  </p>
                  <span className="text-[10px] text-s-ink/40">
                    {t(`room_type.${room.room_type}` as any)} &middot; {t("capacity_value", { count: room.capacity })}
                  </span>
                </div>

                {/* Utilization bar */}
                <div className="w-24 shrink-0">
                  <div className="h-2 rounded-full bg-s-ink/[0.06] overflow-hidden">
                    <div className="h-full bg-s-coral rounded-full" style={{ width: `${utilization}%` }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(room)}
                    aria-label={t("edit_room")}
                    className="p-1.5 rounded-[8px] text-s-ink/30 hover:text-s-coral hover:bg-s-coral/5 transition-colors duration-150"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    aria-label={t("delete_room")}
                    className="p-1.5 rounded-[8px] text-s-ink/30 hover:text-red-500 hover:bg-red-50:bg-red-900/20 transition-colors duration-150"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
