"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, Mail, Check, Clock as ClockIcon, Send } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import type { StaffMember } from "@/lib/types";

// ─────────────────────────────────────────
// Staff Modal (Add / Edit) — now with services & permissions
// ─────────────────────────────────────────

interface Service {
  id: string;
  name_de: string;
}

interface StaffModalProps {
  initial?: StaffMember;
  salonId: string;
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}

function StaffModal({ initial, salonId, services, onClose, onSaved }: StaffModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar_url ?? "");
  const [specialties, setSpecialties] = useState<string[]>(initial?.specialties ?? []);
  const [specInput, setSpecInput] = useState("");
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  // Service assignments
  const [assignedServices, setAssignedServices] = useState<Set<string>>(new Set());
  const [loadingServices, setLoadingServices] = useState(false);

  // Permissions
  const [canEditSchedule, setCanEditSchedule] = useState(true);
  const [canViewOwnBookings, setCanViewOwnBookings] = useState(true);
  const [canManagePortfolio, setCanManagePortfolio] = useState(true);

  // Load existing service assignments when editing
  useEffect(() => {
    if (!initial) return;
    setLoadingServices(true);
    fetch(`/api/staff/services?staff_member_id=${initial.id}`)
      .then(r => r.json())
      .then(d => {
        const ids = new Set<string>((d.items ?? []).map((s: any) => s.service_id));
        setAssignedServices(ids);
      })
      .catch(() => {})
      .finally(() => setLoadingServices(false));

    // Load permissions from staff member
    if ((initial as any).permissions) {
      const p = (initial as any).permissions;
      setCanEditSchedule(p.can_edit_schedule ?? true);
      setCanViewOwnBookings(p.can_view_own_bookings ?? true);
      setCanManagePortfolio(p.can_manage_portfolio ?? true);
    }
  }, [initial]);

  const toggleService = (id: string) => {
    setAssignedServices(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addSpec = () => {
    if (!specInput.trim()) return;
    setSpecialties((prev) => [...prev, specInput.trim()]);
    setSpecInput("");
  };

  const handleSave = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const staffData = {
        name,
        avatar_url: avatar || null,
        specialties,
        is_active: active,
        permissions: {
          can_edit_schedule: canEditSchedule,
          can_view_own_bookings: canViewOwnBookings,
          can_manage_portfolio: canManagePortfolio,
        },
      };

      let staffId = initial?.id;
      if (initial) {
        await fetch(`/api/staff/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(staffData),
        });
      } else {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId, ...staffData }),
        });
        const data = await res.json();
        staffId = data.staff?.id ?? data.id;
      }

      // Save service assignments
      if (staffId) {
        await fetch("/api/staff/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staff_member_id: staffId,
            service_ids: [...assignedServices],
          }),
        });
      }

      onSaved();
      onClose();
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-s-dm-surface rounded-card shadow-warm-lg w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">{initial ? "Bearbeiten" : "Mitarbeiter hinzufügen"}</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30 dark:text-s-dm-text/30" /></button>
        </div>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Foto URL</label>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Spezialitäten</label>
            <div className="flex gap-2 mb-2">
              <input value={specInput} onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }}
                placeholder="z. B. Balayage…"
                className="flex-1 px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
              <button type="button" onClick={addSpec} className="px-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60"><Plus size={14} /></button>
            </div>
            <div className="flex flex-wrap gap-1">
              {specialties.map((s, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-s-coral/10 text-s-coral text-xs rounded-pill">
                  {s}
                  <button type="button" onClick={() => setSpecialties((p) => p.filter((_, j) => j !== i))}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Service assignment */}
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">Services zuweisen</label>
            {loadingServices ? (
              <Spinner size="sm" />
            ) : services.length === 0 ? (
              <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30">Keine Services vorhanden</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {services.map(svc => (
                  <label key={svc.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedServices.has(svc.id)}
                      onChange={() => toggleService(svc.id)}
                      className="w-3.5 h-3.5 rounded accent-s-coral"
                    />
                    <span className="text-sm text-s-ink/70 dark:text-s-dm-text/70">{svc.name_de}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">Berechtigungen</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={canEditSchedule} onChange={e => setCanEditSchedule(e.target.checked)} className="w-3.5 h-3.5 rounded accent-s-coral" />
                <span className="text-sm text-s-ink/70 dark:text-s-dm-text/70">Kalender bearbeiten</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={canViewOwnBookings} onChange={e => setCanViewOwnBookings(e.target.checked)} className="w-3.5 h-3.5 rounded accent-s-coral" />
                <span className="text-sm text-s-ink/70 dark:text-s-dm-text/70">Buchungen sehen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={canManagePortfolio} onChange={e => setCanManagePortfolio(e.target.checked)} className="w-3.5 h-3.5 rounded accent-s-coral" />
                <span className="text-sm text-s-ink/70 dark:text-s-dm-text/70">Portfolio verwalten</span>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setActive(!active)} className={active ? "text-s-coral" : "text-s-ink/30 dark:text-s-dm-text/30"}>
              {active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>
            <span className="text-sm text-s-ink/60 dark:text-s-dm-text/60">Aktiv</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60">Abbrechen</button>
          <button onClick={handleSave} disabled={!name || loading}
            className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Invite Modal
// ─────────────────────────────────────────

function InviteModal({ salonId, onClose, onSent }: { salonId: string; onClose: () => void; onSent: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email || !name.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, email, name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Fehler");
      }
      onSent();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-s-dm-surface rounded-card shadow-warm-lg w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-s-coral" />
            <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">Mitarbeiter einladen</h3>
          </div>
          <button onClick={onClose}><X size={18} className="text-s-ink/30 dark:text-s-dm-text/30" /></button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">E-Mail *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral" />
          </div>
        </div>
        {error && <p className="text-xs text-s-coral mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60">Abbrechen</button>
          <button onClick={handleSend} disabled={!email || !name.trim() || sending}
            className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {sending && <Spinner size="sm" invert />}<Send size={14} /> Einladen
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-s-dm-surface rounded-card shadow-warm-lg w-full max-w-sm p-6">
        <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text mb-3">Mitarbeiter löschen</h3>
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-2">Möchtest du <strong>{member.name}</strong> wirklich löschen?</p>
        {member.future_bookings && member.future_bookings > 0 ? (
          <p className="text-sm text-s-coral font-medium mb-4">
            Diese Person hat {member.future_bookings} Termine. Diese werden storniert.
          </p>
        ) : null}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60">Abbrechen</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Pending Invites Section
// ─────────────────────────────────────────

interface PendingInvite {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
}

function PendingInvites({ salonId }: { salonId: string }) {
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/staff/invite?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => setInvites(d.invites ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  if (loading) return <Spinner size="sm" />;
  if (invites.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2 flex items-center gap-1.5">
        <ClockIcon size={14} /> Ausstehende Einladungen
      </h2>
      <div className="space-y-2">
        {invites.map(inv => (
          <div key={inv.id} className="bg-s-amber-subtle rounded-card border border-s-amber/10 p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{inv.name}</p>
              <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{inv.email}</p>
            </div>
            <span className="text-[10px] font-medium text-s-amber px-2 py-0.5 bg-s-amber/10 rounded-pill">Ausstehend</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff] = useState<(StaffMember & { future_bookings?: number })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(StaffMember & { future_bookings?: number }) | null>(null);

  const loadStaff = () => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      const sid = p?.salon_id ?? null;
      setSalonId(sid);
      if (!sid) return;
      // Load staff and services in parallel
      return Promise.all([
        fetch(`/api/staff?salon_id=${sid}`).then(r => r.json()),
        fetch(`/api/services?salon_id=${sid}`).then(r => r.json()),
      ]).then(([staffData, svcData]) => {
        setStaff(staffData?.staff ?? []);
        setServices(svcData?.items ?? svcData?.services ?? []);
      });
    }).catch(() => {}).finally(() => setLoading(false));
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
          services={services}
          onClose={() => { setAddOpen(false); setEditTarget(null); }}
          onSaved={loadStaff}
        />
      )}
      {inviteOpen && salonId && (
        <InviteModal
          salonId={salonId}
          onClose={() => setInviteOpen(false)}
          onSent={loadStaff}
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
        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Team</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn border border-s-coral text-s-coral text-sm font-medium hover:bg-s-coral/5 transition-colors">
            <Mail size={14} /> Einladen
          </button>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-s-coral text-white text-sm font-medium">
            <Plus size={14} /> Hinzufügen
          </button>
        </div>
      </div>

      {/* Pending invites */}
      {salonId && <PendingInvites salonId={salonId} />}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-s-ink/30 dark:text-s-dm-text/30">
          <p className="text-sm">Noch keine Mitarbeiter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff.map((s) => (
            <div key={s.id} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-s-coral/10 flex items-center justify-center shrink-0 text-sm font-bold text-s-coral">
                {s.avatar_url ? (
                  <img src={s.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-s-ink dark:text-s-dm-text">{s.name}</p>
                {s.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.specialties.slice(0, 3).map((sp, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/50 dark:text-s-dm-text/50 rounded-pill">{sp}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(s.id, s.is_active)} className={s.is_active ? "text-s-coral" : "text-s-ink/20 dark:text-s-dm-text/20"}>
                  {s.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => setEditTarget(s)} className="p-1.5 text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral transition-colors">
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
