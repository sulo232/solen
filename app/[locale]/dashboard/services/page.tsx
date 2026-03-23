"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, Camera } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import type { Service, SalonCategory, AgeGroup, Gender } from "@/lib/types";

const CATEGORY_LABELS: Record<SalonCategory, string> = {
  coiffeur: "Coiffeur", barbershop: "Barbershop", nails: "Nails",
  spa: "Spa / Massage", makeup: "Make-up", waxing: "Waxing",
};
const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "child", label: "Kinder" }, { value: "teenager", label: "Teenager" },
  { value: "adult", label: "Erwachsene" }, { value: "senior", label: "Senioren" },
];
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Männlich" }, { value: "female", label: "Weiblich" },
  { value: "non_binary", label: "Non-binary" },
];

// ─────────────────────────────────────────
// Service Modal
// ─────────────────────────────────────────

function ServiceModal({ initial, salonId, salonCategories, onClose, onSaved }: {
  initial?: Service;
  salonId: string;
  salonCategories: SalonCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name_de: initial?.name_de ?? "",
    name_en: initial?.name_en ?? "",
    category: initial?.category ?? (salonCategories[0] ?? ""),
    duration_minutes: initial?.duration_minutes ?? 60,
    price: initial?.price ?? 80,
    description_de: initial?.description_de ?? "",
    buffer_minutes: (initial as Record<string, number>)?.buffer_minutes ?? 0,
    processing_minutes: (initial as Record<string, number>)?.processing_minutes ?? 0,
    finishing_minutes: (initial as Record<string, number>)?.finishing_minutes ?? 0,
    suitable_for: initial?.suitable_for ?? [] as AgeGroup[],
    suitable_gender: initial?.suitable_gender ?? [] as Gender[],
    is_active: initial?.is_active ?? true,
  });
  const [photos, setPhotos] = useState<string[]>((initial as Record<string, string[]>)?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = <T,>(field: "suitable_for" | "suitable_gender", val: T) => {
    const arr = form[field] as T[];
    setForm({ ...form, [field]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] });
  };

  const handleSave = async () => {
    if (!form.name_de) return;
    setLoading(true);
    try {
      if (initial) {
        await fetch(`/api/services/${initial.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/services", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, salon_id: salonId }),
        });
      }
      onSaved(); onClose();
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-card shadow-warm-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-bold text-base">{initial ? "Service bearbeiten" : "Service hinzufügen"}</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Name DE *</label>
              <input value={form.name_de} onChange={(e) => setForm({ ...form, name_de: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Name EN</label>
              <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Kategorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SalonCategory })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 text-sm bg-white focus:outline-none focus:border-s-coral">
                {salonCategories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Dauer (Min)</label>
              <input type="number" min={15} step={15} value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Preis CHF</label>
              <input type="number" min={0} value={form.price}
                onChange={(e) => setForm({ ...form, price: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Beschreibung</label>
            <textarea value={form.description_de} onChange={(e) => setForm({ ...form, description_de: e.target.value })}
              rows={2} className="w-full px-3 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral resize-none" />
          </div>
          {/* Time breakdown fields */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Aufbauzeit (Min)</label>
              <input type="number" min={0} step={5} value={form.buffer_minutes}
                onChange={(e) => setForm({ ...form, buffer_minutes: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Einwirkzeit (Min)</label>
              <input type="number" min={0} step={5} value={form.processing_minutes}
                onChange={(e) => setForm({ ...form, processing_minutes: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Nachbereitung (Min)</label>
              <input type="number" min={0} step={5} value={form.finishing_minutes}
                onChange={(e) => setForm({ ...form, finishing_minutes: +e.target.value })}
                className="w-full px-2 py-2 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral" />
            </div>
          </div>
          {/* Service photos */}
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">Fotos (max. 3)</label>
            <div className="flex gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-button overflow-hidden border border-s-ink/10">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-s-ink/60 text-white flex items-center justify-center">
                    <X size={8} />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="w-16 h-16 rounded-button border-2 border-dashed border-s-ink/10 flex items-center justify-center cursor-pointer hover:border-s-coral/40 transition-colors">
                  {uploading ? <Spinner size="sm" /> : <Camera size={16} className="text-s-ink/30" />}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !initial?.id) return;
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("service_id", initial.id);
                      const res = await fetch("/api/services/photos", { method: "POST", body: fd });
                      if (res.ok) {
                        const { url } = await res.json();
                        setPhotos((prev) => [...prev, url]);
                      }
                    } catch {} finally { setUploading(false); }
                  }} />
                </label>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Geeignet für</label>
              <div className="flex flex-wrap gap-1">
                {AGE_OPTIONS.map((a) => (
                  <button key={a.value} type="button" onClick={() => toggle("suitable_for", a.value)}
                    className={["px-2 py-0.5 rounded-pill text-xs border transition-colors",
                      form.suitable_for.includes(a.value) ? "bg-s-coral text-white border-s-coral" : "border-s-ink/10 text-s-ink/50"].join(" ")}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink/50 mb-1">Geschlecht</label>
              <div className="flex flex-wrap gap-1">
                {GENDER_OPTIONS.map((g) => (
                  <button key={g.value} type="button" onClick={() => toggle("suitable_gender", g.value)}
                    className={["px-2 py-0.5 rounded-pill text-xs border transition-colors",
                      form.suitable_gender.includes(g.value) ? "bg-s-coral text-white border-s-coral" : "border-s-ink/10 text-s-ink/50"].join(" ")}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className={form.is_active ? "text-s-coral" : "text-s-ink/30"}>
              {form.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>
            <span className="text-sm text-s-ink/60">Aktiv</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-s-ink/10 text-sm text-s-ink/60">Abbrechen</button>
          <button onClick={handleSave} disabled={!form.name_de || loading}
            className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function ServicesPage() {
  const locale = useLocale();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonCategories, setSalonCategories] = useState<SalonCategory[]>([]);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadServices = () => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      setSalonId(p?.salon_id ?? null);
      setSalonCategories(p?.salon_categories ?? []);
      return fetch(`/api/services?salon_id=${p?.salon_id}`).then((r) => r.json());
    }).then((d) => setServices(d?.services ?? [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadServices(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !current }) });
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/services/${deleteTarget.id}`, { method: "DELETE" });
      setServices((p) => p.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ } finally { setDeleteLoading(false); }
  };

  return (
    <DashboardLayout>
      {(addOpen || editTarget) && salonId && (
        <ServiceModal initial={editTarget ?? undefined} salonId={salonId} salonCategories={salonCategories}
          onClose={() => { setAddOpen(false); setEditTarget(null); }} onSaved={loadServices} />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-card shadow-warm-lg w-full max-w-sm p-6">
            <h3 className="font-heading font-bold text-base mb-3">Service löschen</h3>
            <p className="text-sm text-s-ink/60 mb-4">Möchtest du <strong>{deleteTarget.name_de}</strong> löschen?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-button border border-s-ink/10 text-sm text-s-ink/60">Abbrechen</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteLoading && <Spinner size="sm" invert />}Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-s-ink">Services</h1>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-s-coral text-white text-sm font-medium">
          <Plus size={14} /> Hinzufügen
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-s-ink/30"><p className="text-sm">Noch keine Services</p></div>
      ) : (
        <div className="bg-white rounded-card border border-s-ink/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-s-bg-surface border-b border-s-ink/5">
              <tr>
                {["Name", "Kategorie", "Dauer", "Preis", "Aktiv", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-s-ink/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-s-bg-surface transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-s-ink">{s.name_de}</p>
                    {s.name_en && <p className="text-xs text-s-ink/30">{s.name_en}</p>}
                  </td>
                  <td className="px-4 py-3 text-s-ink/60">{CATEGORY_LABELS[s.category]}</td>
                  <td className="px-4 py-3 data-text text-s-ink/60">{s.duration_minutes} min</td>
                  <td className="px-4 py-3 data-text text-s-ink">{formatCurrency(Number(s.price), locale)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(s.id, s.is_active)} className={s.is_active ? "text-s-coral" : "text-s-ink/20"}>
                      {s.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditTarget(s)} className="p-1.5 text-s-ink/30 hover:text-s-coral transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-s-ink/30 hover:text-s-coral transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
