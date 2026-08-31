"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, Mail, Check, Clock as ClockIcon, Send } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import { avGrad } from "@/lib/avatar-gradients";
import {
  PERMISSION_AREAS,
  presetPermissions,
  inferRole,
  type PermissionKey,
  type StaffPermissions,
  type AccessRole,
} from "@/lib/staff-permissions";
import type { StaffMember } from "@/lib/types";

// Initials + deterministic avatar gradient (consistent colour per person), per the approved mobile skin.
const initials = (n: string) => {
  const p = n.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "—";
};

// Swiss/Basel-relevant spoken-language set for the staff editor's language picker.
// Stored lowercase in staff_members.languages, shown uppercase in the UI (matches
// the PDP/booking subtitle formatting in SalonTeam.tsx / StaffStep.tsx).
const LANGUAGE_CODES = ["de", "en", "fr", "it", "es", "pt", "ru", "uk", "tr", "sq", "sr", "hr", "ar", "jp", "zh"] as const;

// Chip order for the Access preset row. "owner" is skipped on purpose, an owner is not a staff row.
const ROLE_CHIPS: Exclude<AccessRole, "owner">[] = ["manager", "front_desk", "staff", "custom"];

// i18n key per preset role and per permission area, so the eight-area model from
// lib/staff-permissions.ts stays the single source of truth for the KEYS while the copy
// itself lives in messages/*.json like every other string on this page.
const ROLE_CHIP_KEYS: Record<Exclude<AccessRole, "owner">, string> = {
  manager: "roleManager",
  front_desk: "roleFrontDesk",
  staff: "roleStaff",
  custom: "roleCustom",
};

const AREA_LABEL_KEYS: Record<PermissionKey, string> = {
  calendar: "areaCalendar",
  schedule: "areaSchedule",
  clients: "areaClients",
  catalog: "areaCatalog",
  marketing: "areaMarketing",
  finance: "areaFinance",
  team: "areaTeam",
  settings: "areaSettings",
};

const AREA_DESC_KEYS: Partial<Record<PermissionKey, string>> = {
  schedule: "areaScheduleDesc",
  team: "areaTeamDesc",
};

const VALID_PERMISSION_KEYS = new Set<PermissionKey>(PERMISSION_AREAS.map((a) => a.key));

// staff_members.permissions has been written by at least four different shapes over this
// column's life: absent/null, {} (every one of today's 70 live rows), the new eight-area
// object, the old three-key legacy object, and a plain array of granted-key strings from an
// older writer. A crash on the array shape was the bug fixed at 91624012f, so this stays
// defensive rather than trusting any one shape.
function normalizePermissions(raw: unknown): StaffPermissions {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const perms: StaffPermissions = {};
    for (const key of raw) {
      if (typeof key === "string" && VALID_PERMISSION_KEYS.has(key as PermissionKey)) {
        perms[key as PermissionKey] = true;
      }
    }
    return perms;
  }
  if (typeof raw !== "object") return {};
  const p = raw as Record<string, unknown>;
  const hasEightAreaKeys = PERMISSION_AREAS.some((a) => a.key in p);
  if (hasEightAreaKeys) {
    const perms: StaffPermissions = {};
    for (const area of PERMISSION_AREAS) {
      if (p[area.key]) perms[area.key] = true;
    }
    return perms;
  }
  // Legacy three-key shape. can_edit_schedule maps to BOTH calendar and schedule;
  // can_view_own_bookings and can_manage_portfolio have no eight-area equivalent, so they
  // are dropped rather than guessed at a mapping.
  if (p.can_edit_schedule) return { calendar: true, schedule: true };
  return {};
}

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
  const t = useTranslations("dashboard.staffPage");
  const [name, setName] = useState(initial?.name ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar_url ?? "");
  const [specialties, setSpecialties] = useState<string[]>(initial?.specialties ?? []);
  const [specInput, setSpecInput] = useState("");
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? []);
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  // Service assignments
  const [assignedServices, setAssignedServices] = useState<Set<string>>(new Set());
  const [loadingServices, setLoadingServices] = useState(false);

  // Access: the eight-area grant set plus the preset role it currently matches (or "custom").
  const [perms, setPerms] = useState<StaffPermissions>({});
  const [role, setRole] = useState<AccessRole>("custom");
  const [commissionRate, setCommissionRate] = useState(initial?.commission_rate ?? 0);

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
      .catch((err) => console.error("[DashboardStaff] Failed to fetch assigned services:", err))
      .finally(() => setLoadingServices(false));

    // Load permissions from staff member, normalizing whichever of the four shapes this row
    // was written in (see normalizePermissions above).
    const normalized = normalizePermissions((initial as any).permissions);
    setPerms(normalized);
    setRole(inferRole(normalized));
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

  const toggleLanguage = (code: string) => {
    setLanguages((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  // Picking a preset chip replaces the grant set wholesale; "custom" just sets the role and
  // leaves whatever boxes are currently checked alone.
  const selectRole = (r: AccessRole) => {
    setRole(r);
    if (r !== "custom") setPerms(presetPermissions(r));
  };

  // Toggling one box snaps the role back to whichever preset it now matches, or "custom".
  const togglePermission = (key: PermissionKey) => {
    const next = { ...perms, [key]: !perms[key] };
    setPerms(next);
    setRole(inferRole(next));
  };

  const handleSave = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const staffData = {
        name,
        avatar_url: avatar || null,
        specialties,
        languages,
        is_active: active,
        commission_rate: commissionRate,
        permissions: perms,
        access_role: role,
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
      // V3-D334 (overnight T2): error handling per CLAUDE.md.
    } catch (err) { console.error("[Staff] save (create or update) failed:", err); } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-md p-6 max-h-[85vh] overflow-y-auto scroll-stable-gutter">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base text-s-ink">{initial ? t("editTitle") : t("addTitle")}</h3>
          {/* mockup-ok: a11y touch-target fix (FRONTEND_AUDIT_2026-07-08.md, dash-ops), 18px raised to the locked 44px icon-button spec via a padded hit-area, no visual redesign */}
          <button onClick={onClose} aria-label={t("close")} className="grid place-items-center h-11 w-11 -m-2.5 rounded-full hover:bg-s-bg-sunken transition-colors"><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("nameLabel")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm text-s-ink focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("photoUrlLabel")}</label>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3 py-2 text-sm text-s-ink focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("specialtiesLabel")}</label>
            <div className="flex gap-2 mb-2">
              <input value={specInput} onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }}
                placeholder={t("specialtyPlaceholder")}
                className="flex-1 px-3 py-2 text-sm text-s-ink focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              <button type="button" onClick={addSpec} aria-label={t("addSpecialty")} className="px-2.5 rounded-btn bg-s-bg-sunken text-s-ink-2"><Plus size={14} strokeWidth={1.6} /></button>
            </div>
            <div className="flex flex-wrap gap-1">
              {specialties.map((s, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-s-bg-sunken text-s-ink text-xs rounded-full">
                  {s}
                  <button type="button" onClick={() => setSpecialties((p) => p.filter((_, j) => j !== i))}>×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Spoken languages — toggle chips from a fixed code set, persisted to
              staff_members.languages. Selected = sunken gray fill (no-black-selected law). */}
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("languagesLabel")}</label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGE_CODES.map((code) => {
                const active = languages.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleLanguage(code)}
                    aria-pressed={active}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-s-bg-sunken text-s-ink border-transparent"
                        : "bg-white text-s-ink-2 border-s-border hover:bg-s-bg-sunken"
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service assignment */}
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("assignServices")}</label>
            {loadingServices ? (
              <Spinner size="sm" />
            ) : services.length === 0 ? (
              <p className="text-xs text-s-ink/30">{t("noServices")}</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {services.map(svc => (
                  <label key={svc.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedServices.has(svc.id)}
                      onChange={() => toggleService(svc.id)}
                      className="w-3.5 h-3.5 rounded accent-s-ink"
                    />
                    <span className="text-sm text-s-ink/70">{svc.name_de}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* mockup-ok: public/_mockups/staff-access-eight-areas.html (PROPOSED card), owner-approved eight-area access model replacing the three legacy permission checkboxes */}
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-2">{t("access")}</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {ROLE_CHIPS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => selectRole(r)}
                  aria-pressed={role === r}
                  className={`rounded-full px-3.5 py-2 text-[13px] border transition-colors ${
                    role === r
                      ? "bg-s-bg-sunken text-s-ink font-semibold border-transparent"
                      : "bg-white text-s-ink-2 border-s-border hover:bg-s-bg-sunken"
                  }`}
                >
                  {t(ROLE_CHIP_KEYS[r] as any)}
                </button>
              ))}
            </div>
            <div className="h-px bg-s-border mb-4" />
            <div className="space-y-2">
              {PERMISSION_AREAS.map((area) => (
                <label key={area.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!perms[area.key]}
                    onChange={() => togglePermission(area.key)}
                    className="w-3.5 h-3.5 rounded accent-s-ink"
                  />
                  <span className="text-sm text-s-ink/70">{t(AREA_LABEL_KEYS[area.key] as any)}</span>
                  {AREA_DESC_KEYS[area.key] && (
                    <span className="text-[12px] text-s-ink-2">{t(AREA_DESC_KEYS[area.key] as any)}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Commission rate */}
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("commissionLabel")}</label>
            <input type="number" min="0" max="100" value={commissionRate}
              onChange={(e) => setCommissionRate(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
              className="w-full px-3 py-2 text-sm text-s-ink focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            <p className="text-[12px] text-s-ink/30 mt-1">{t("commissionHint")}</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setActive(!active)} className={active ? "text-s-ink" : "text-s-ink/30"}>
              {active ? <ToggleRight size={22} strokeWidth={2.2} /> : <ToggleLeft size={22} strokeWidth={2.2} />}
            </button>
            <span className="text-sm text-s-ink-2">{t("active")}</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-colors">{t("cancel")}</button>
          <button onClick={handleSave} disabled={!name || loading}
            className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {loading && <Spinner size="sm" invert />}{t("save")}
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
  const t = useTranslations("dashboard.staffPage");
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
        body: JSON.stringify({ salon_id: salonId, email, staff_name: name.trim() }),
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
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail size={16} strokeWidth={1.9} className="text-s-ink" />
            <h3 className="font-heading text-base text-s-ink">{t("inviteTitle")}</h3>
          </div>
          {/* mockup-ok: a11y touch-target fix (FRONTEND_AUDIT_2026-07-08.md, dash-ops), 18px raised to the locked 44px icon-button spec via a padded hit-area, no visual redesign */}
          <button onClick={onClose} aria-label={t("close")} className="grid place-items-center h-11 w-11 -m-2.5 rounded-full hover:bg-s-bg-sunken transition-colors"><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("nameLabel")}</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm text-s-ink focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("emailLabel")}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm text-s-ink focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
          </div>
        </div>
        {error && <p className="text-xs text-s-error mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-colors">{t("cancel")}</button>
          <button onClick={handleSend} disabled={!email || !name.trim() || sending}
            className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {sending && <Spinner size="sm" invert />}<Send size={14} strokeWidth={1.6} /> {t("invite")}
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
  const t = useTranslations("dashboard.staffPage");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch(`/api/staff/${member.id}`, { method: "DELETE" });
      onDeleted(member.id);
      onClose();
      // V3-D334 (overnight T2): error handling per CLAUDE.md.
    } catch (err) { console.error("[Staff] delete failed:", err); } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-6">
        <h3 className="font-heading text-base text-s-ink mb-3">{t("deleteTitle")}</h3>
        <p className="text-sm text-s-ink-2 mb-2">{t.rich("deleteConfirm", { name: member.name, strong: (chunks) => <strong>{chunks}</strong> })}</p>
        {member.future_bookings && member.future_bookings > 0 ? (
          <p className="text-sm text-s-warning font-medium mb-4">
            {t("deleteBookingsWarning", { count: member.future_bookings })}
          </p>
        ) : null}
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-colors">{t("cancel")}</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {loading && <Spinner size="sm" invert />}{t("delete")}
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
  const t = useTranslations("dashboard.staffPage");
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/staff/invite?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => setInvites(d.invites ?? []))
      .catch((err) => console.error("[DashboardStaff] Failed to fetch staff invites:", err))
      .finally(() => setLoading(false));
  }, [salonId]);

  if (loading) return <Spinner size="sm" />;
  if (invites.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-s-ink-2 mb-2 flex items-center gap-1.5">
        <ClockIcon size={14} strokeWidth={1.6} /> {t("pendingInvites")}
      </h2>
      <div className="space-y-2">
        {invites.map(inv => (
          <div key={inv.id} className="bg-s-warning-bg rounded-2xl border border-s-warning/10 p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-s-ink">{inv.name}</p>
              <p className="text-xs text-s-ink/40">{inv.email}</p>
            </div>
            <DashStatusPill tone="warning">{t("pendingBadge")}</DashStatusPill>
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
  const t = useTranslations("dashboard.staffPage");
  const [staff, setStaff] = useState<(StaffMember & { future_bookings?: number })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(StaffMember & { future_bookings?: number }) | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

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
    }).catch((err) => console.error("[DashboardStaff] Failed to load staff and services:", err)).finally(() => setLoading(false));
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
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">{t("teamTitle")}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn border border-s-ink text-s-ink text-sm font-medium hover:bg-s-bg-sunken transition-colors">
            <Mail size={14} strokeWidth={1.6} /> {t("invite")}
          </button>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-s-ink text-white text-sm font-medium hover:bg-black transition-colors">
            <Plus size={14} strokeWidth={1.6} /> {t("add")}
          </button>
        </div>
      </div>

      {/* Pending invites */}
      {salonId && <PendingInvites salonId={salonId} />}

      {/* Filter pills — light-blue active (approved skin) */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={[
              "px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors border",
              statusFilter === f
                ? "bg-s-accent-bright/10 text-s-accent-bright border-transparent"
                : "bg-white border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink",
            ].join(" ")}
          >
            {f === "all" ? t("filterAll") : f === "active" ? t("filterActive") : t("filterInactive")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-s-ink/30">
          <p className="text-sm">{t("emptyState")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff
            .filter((s) => statusFilter === "all" ? true : statusFilter === "active" ? s.is_active : !s.is_active)
            .map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-s-border p-4 flex items-start gap-3">
              <div className="w-11 h-11 rounded-full shrink-0 overflow-hidden relative">
                {s.avatar_url ? (
                  <Image src={s.avatar_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <span className={`grid place-items-center w-full h-full bg-gradient-to-br ${avGrad(s.name)} text-white font-heading font-semibold text-[15px]`}>
                    {initials(s.name)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-s-ink">{s.name}</p>
                {s.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.specialties.slice(0, 3).map((sp, i) => (
                      <span key={i} className="text-[12px] px-1.5 py-0.5 bg-s-bg-sunken text-s-ink-2 rounded-pill">{sp}</span>
                    ))}
                  </div>
                )}
                {typeof s.commission_rate === "number" && s.commission_rate > 0 && (
                  <p className="text-[12px] text-s-ink-2 mt-1.5">
                    {t.rich("commissionCard", { rate: s.commission_rate, b: (chunks) => <b className="font-heading text-s-ink">{chunks}</b> })}
                  </p>
                )}
              </div>
              {/* mockup-ok: a11y touch-target fix (FRONTEND_AUDIT_2026-07-08.md, dash-ops), 40px raised to the locked 44px icon-button spec (matches the 44px avatar already in this row), no visual redesign */}
              <div className="flex items-center gap-0.5 shrink-0 -mr-1.5">
                <button onClick={() => toggleActive(s.id, s.is_active)} aria-label={s.is_active ? t("deactivate") : t("activate")}
                  className={`grid place-items-center w-11 h-11 rounded-full transition-colors ${s.is_active ? "text-s-ink" : "text-s-ink/20"} hover:bg-s-bg-sunken`}>
                  {s.is_active ? <ToggleRight size={18} strokeWidth={1.9} /> : <ToggleLeft size={18} strokeWidth={1.9} />}
                </button>
                <button onClick={() => setEditTarget(s)} aria-label={t("edit")}
                  className="grid place-items-center w-11 h-11 rounded-full text-s-ink/30 hover:text-s-ink hover:bg-s-bg-sunken transition-colors">
                  <Pencil size={14} strokeWidth={1.6} />
                </button>
                <button onClick={() => setDeleteTarget(s)} aria-label={t("delete")}
                  className="grid place-items-center w-11 h-11 rounded-full text-s-ink/30 hover:text-s-error hover:bg-s-bg-sunken transition-colors">
                  <Trash2 size={14} strokeWidth={1.6} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
