"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import type { StaffMember } from "@/lib/types";

// ─────────────────────────────────────────
// Staff Modal (Add / Edit)
// ─────────────────────────────────────────

interface StaffModalProps {
  initial?: StaffMember;
  salonId: string;
  onClose: () => void;
  onSaved: () => void;
}

function StaffModal({ initial, salonId, onClose, onSaved }: StaffModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar_url ?? "");
  const [specialties, setSpecialties] = useState<string[]>(initial?.specialties ?? []);
  const [specInput, setSpecInput] = useState("");
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  const addSpec = () => {
    if (!specInput.trim()) return;
    setSpecialties((prev) => [...prev, specInput.trim()]);
    setSpecInput("");
  };

  const handleSave = async () => {
    if (!name) return;
    setLoading(true);
    try {
      if (initial) {
        await fetch(`/api/staff/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, avatar_url: avatar || null, specialties, is_active: active }),
        });
      } else {
        await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId, name, avatar_url: avatar || null, specialties, is_active: active }),
        });
      }
      onSaved();
      onClose();
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-bold text-base">{initial ? "Bearbeiten" : "Mitarbeiter hinzufügen"}</h3>
          <button onClick={onClose}><X size={18} className="text-dark/30" /></button>
        </div>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-dark/50 mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal" />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/50 mb-1">Foto URL</label>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal" />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark/50 mb-1">Spezialitäten</label>
            <div className="flex gap-2 mb-2">
              <input value={specInput} onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }}
                placeholder="z. B. Balayage…"
                className="flex-1 px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal" />
              <button type="button" onClick={addSpec} className="px-2.5 rounded-button bg-gray-100 text-dark/60"><Plus size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-1">
              {specialties.map((s, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-teal/10 text-teal text-xs rounded-pill">
                  {s}
                  <button type="button" onClick={() => setSpecialties((p) => p.filter((_, j) => j !== i))}>×</button>
                </span>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setActive(!active)} className={active ? "text-teal" : "text-dark/30"}>
              {active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>
            <span className="text-sm text-dark/60">Aktiv</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-gray-200 text-sm text-dark/60">Abbrechen</button>
          <button onClick={handleSave} disabled={!name || loading}
            className="flex-1 py-2.5 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────

function DeleteModal({ member, onClose, onDeleted }: {
  member: StaffMember & { future_bookings?: number };
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(`/api/staff/${member.id}`, { method: "DELETE" });
      onDeleted(member.id);
      onClose();
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
        <h3 className="font-heading font-bold text-base mb-3">Mitarbeiter löschen</h3>
        <p className="text-sm text-dark/60 mb-2">Möchtest du <strong>{member.name}</strong> wirklich löschen?</p>
        {member.future_bookings && member.future_bookings > 0 ? (
          <p className="text-sm text-coral font-medium mb-4">
            Diese Person hat {member.future_bookings} Termine. Diese werden storniert.
          </p>
        ) : null}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-gray-200 text-sm text-dark/60">Abbrechen</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-button bg-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff] = useState<(StaffMember & { future_bookings?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(StaffMember & { future_bookings?: number }) | null>(null);

  const loadStaff = () => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      setSalonId(p?.salon_id ?? null);
      return fetch(`/api/staff?salon_id=${p?.salon_id}`).then((r) => r.json());
    }).then((d) => setStaff(d?.staff ?? [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadStaff(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    setStaff((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  };

  return (
    <DashboardLayout>
      {(addOpen || editTarget) && salonId && (
        <StaffModal
          initial={editTarget ?? undefined}
          salonId={salonId}
          onClose={() => { setAddOpen(false); setEditTarget(null); }}
          onSaved={loadStaff}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          member={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => { setStaff((p) => p.filter((s) => s.id !== id)); setDeleteTarget(null); }}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-dark">Team</h1>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-teal text-white text-sm font-medium">
          <Plus size={14} /> Hinzufügen
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-dark/30">
          <p className="text-sm">Noch keine Mitarbeiter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff.map((s) => (
            <div key={s.id} className="bg-white rounded-card border border-gray-100 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center shrink-0 text-sm font-bold text-teal">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-dark">{s.name}</p>
                {s.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.specialties.slice(0, 3).map((sp, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-dark/50 rounded-pill">{sp}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(s.id, s.is_active)} className={s.is_active ? "text-teal" : "text-dark/20"}>
                  {s.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => setEditTarget(s)} className="p-1.5 text-dark/30 hover:text-teal transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-dark/30 hover:text-coral transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
