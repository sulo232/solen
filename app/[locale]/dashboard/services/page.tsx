"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, Camera, Check, Clock, Upload, GripVertical, FileUp, ChevronDown, Search } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import { serviceTemplates } from "@/lib/service-templates";
import type { ServiceTemplate } from "@/lib/service-templates";
import type { Service, SalonCategory, AgeGroup, Gender } from "@/lib/types";

const CATEGORY_LABELS: Record<SalonCategory, string> = {
  coiffeur: "Coiffeur", barbershop: "Barbershop", nails: "Nails",
  spa: "Spa / Massage",
};
const AGE_OPTIONS: { value: AgeGroup }[] = [
  { value: "child" }, { value: "teenager" },
  { value: "adult" }, { value: "senior" },
];
const GENDER_OPTIONS: { value: Gender }[] = [
  { value: "male" }, { value: "female" },
  { value: "non_binary" },
];

// ─────────────────────────────────────────
// Service Modal
// ─────────────────────────────────────────

function ServiceModal({ initial, salonId, salonCategories, onClose, onSaved, onDelete }: {
  initial?: Service;
  salonId: string;
  salonCategories: SalonCategory[];
  onClose: () => void;
  onSaved: () => void;
  onDelete?: (s: Service) => void;
}) {
  const t = useTranslations('dashboard.services');
  const [form, setForm] = useState({
    name_de: initial?.name_de ?? "",
    name_en: initial?.name_en ?? "",
    category: initial?.category ?? (salonCategories[0] ?? ""),
    duration_minutes: initial?.duration_minutes ?? 60,
    price: initial?.price ?? 80,
    description_de: initial?.description_de ?? "",
    buffer_minutes: (initial as unknown as Record<string, number>)?.buffer_minutes ?? 0,
    processing_minutes: (initial as unknown as Record<string, number>)?.processing_minutes ?? 0,
    finishing_minutes: (initial as unknown as Record<string, number>)?.finishing_minutes ?? 0,
    suitable_for: initial?.suitable_for ?? [] as AgeGroup[],
    suitable_gender: initial?.suitable_gender ?? [] as Gender[],
    is_active: initial?.is_active ?? true,
  });
  const [photos, setPhotos] = useState<string[]>((initial as unknown as Record<string, string[]>)?.photo_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  // While one photo delete is in flight for this service, ignore further delete
  // clicks on its OTHER photos: two concurrent DELETEs raced the array write on
  // the server (fixed with a CAS retry loop there), but a client that never fires
  // the second request until the first settles avoids the race, and its retries,
  // entirely for the common case of a user double-clicking.
  const [deletingPhoto, setDeletingPhoto] = useState(false);

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
      // V3-D334 (overnight T2): error handling per CLAUDE.md.
    } catch (err) { console.error("[Services] save (create or edit) failed:", err); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-md p-6 overflow-y-auto max-h-[90vh] scroll-stable-gutter">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base">{initial ? t('editService') : t('addService')}</h3>
          <button onClick={onClose} className="transition-transform active:scale-[0.94] active:duration-[80ms] active:ease-glide"><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
        </div>
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('nameDeLabel')}</label>
              <input value={form.name_de} onChange={(e) => setForm({ ...form, name_de: e.target.value })}
                className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('nameEnLabel')}</label>
              <input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="w-full px-3 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('categoryLabel')}</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SalonCategory })}
                className="w-full px-2 py-2 text-sm"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                {salonCategories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('durationLabel')}</label>
              <input type="number" min={15} step={15} value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })}
                className="w-full px-2 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('priceLabel')}</label>
              <input type="number" min={0} value={form.price}
                onChange={(e) => setForm({ ...form, price: +e.target.value })}
                className="w-full px-2 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('descriptionLabel')}</label>
            <textarea value={form.description_de} onChange={(e) => setForm({ ...form, description_de: e.target.value })}
              rows={2} className="w-full px-3 py-2 text-sm resize-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
          </div>
          {/* Time breakdown fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('bufferLabel')}</label>
              <input type="number" min={0} step={5} value={form.buffer_minutes}
                onChange={(e) => setForm({ ...form, buffer_minutes: +e.target.value })}
                className="w-full px-2 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('processingLabel')}</label>
              <input type="number" min={0} step={5} value={form.processing_minutes}
                onChange={(e) => setForm({ ...form, processing_minutes: +e.target.value })}
                className="w-full px-2 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('finishingLabel')}</label>
              <input type="number" min={0} step={5} value={form.finishing_minutes}
                onChange={(e) => setForm({ ...form, finishing_minutes: +e.target.value })}
                className="w-full px-2 py-2 text-sm" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            </div>
          </div>
          {/* Service photos */}
          <div>
            <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('photosLabel')}</label>
            <div className="flex gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-btn overflow-hidden border border-s-border">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button type="button" disabled={deletingPhoto} onClick={async () => {
                    if (!initial?.id) { setPhotos(photos.filter((_, j) => j !== i)); return; }
                    setDeletingPhoto(true);
                    try {
                      const res = await fetch(`/api/services/${initial.id}/photos`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url }),
                      });
                      if (res.ok) {
                        const data = (await res.json()).data;
                        setPhotos(data.photo_urls);
                      } else {
                        const err = await res.json().catch(() => ({}));
                        console.error("[ServiceForm] photo delete failed:", res.status, err);
                      }
                    } catch (err) {
                      console.error("[ServiceForm] photo delete failed:", err);
                    } finally { setDeletingPhoto(false); }
                  }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-s-ink/60 text-white flex items-center justify-center disabled:opacity-50">
                    <X size={8} />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="w-16 h-16 rounded-btn border-2 border-dashed border-s-border flex items-center justify-center cursor-pointer hover:border-s-accent-bright/40 transition-colors">
                  {uploading ? <Spinner size="sm" /> : <Camera size={16} strokeWidth={1.9} className="text-s-ink/30" />}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !initial?.id) return;
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      // A15-upload-hardening (2026-07-27): required by the route's CSRF
                      // guard, see lib/upload-security.ts requireUploadHeader.
                      const res = await fetch(`/api/services/${initial.id}/photos`, {
                        method: "POST",
                        headers: { "x-solen-upload": "1" },
                        body: fd,
                      });
                      if (res.ok) {
                        const data = (await res.json()).data;
                        setPhotos((prev) => [...prev, data.url]);
                      } else {
                        const err = await res.json().catch(() => ({}));
                        console.error("[ServiceForm] photo upload failed:", res.status, err);
                        alert(err.error || t('importFailed'));
                      }
                    } catch (err) {
                      console.error("[ServiceForm] photo upload failed:", err);
                      alert(t('importFailed'));
                    } finally { setUploading(false); }
                  }} />
                </label>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('suitableForLabel')}</label>
              <div className="flex flex-wrap gap-1">
                {AGE_OPTIONS.map((a) => (
                  <button key={a.value} type="button" onClick={() => toggle("suitable_for", a.value)}
                    className={["inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium border transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide",
                      form.suitable_for.includes(a.value) ? "bg-s-accent-bright/10 text-s-accent-bright border-s-accent-bright/10" : "border-s-border text-s-ink-2"].join(" ")}>
                    {form.suitable_for.includes(a.value) && <Check size={13} strokeWidth={2.6} />}
                    {t(`age_${a.value}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t('genderLabel')}</label>
              <div className="flex flex-wrap gap-1">
                {GENDER_OPTIONS.map((g) => (
                  <button key={g.value} type="button" onClick={() => toggle("suitable_gender", g.value)}
                    className={["inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium border transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide",
                      form.suitable_gender.includes(g.value) ? "bg-s-accent-bright/10 text-s-accent-bright border-s-accent-bright/10" : "border-s-border text-s-ink-2"].join(" ")}>
                    {form.suitable_gender.includes(g.value) && <Check size={13} strokeWidth={2.6} />}
                    {t(`gender_${g.value}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className={form.is_active ? "text-s-accent-bright" : "text-s-ink/30"}>
              {form.is_active ? <ToggleRight size={22} strokeWidth={2.2} /> : <ToggleLeft size={22} strokeWidth={2.2} />}
            </button>
            <span className="text-sm text-s-ink-2">{t('active')}</span>
          </label>
        </div>
        <div className="flex gap-2 items-center">
          {initial && onDelete && (
            <button type="button" onClick={() => { onClose(); onDelete(initial); }} aria-label={t('delete')}
              className="text-s-ink-2 hover:text-s-error transition-[colors,transform] active:scale-[0.94] active:duration-[80ms] active:ease-glide grid place-items-center px-1.5 py-2.5">
              <Trash2 size={18} strokeWidth={1.9} />
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 transition-transform active:scale-[0.97] active:duration-[80ms] active:ease-glide">{t('cancel')}</button>
          <button onClick={handleSave} disabled={!form.name_de || loading}
            className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-[0.97] active:duration-[80ms] active:ease-glide">
            {loading && <Spinner size="sm" invert />}{t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Template Quick-Add
// ─────────────────────────────────────────

function TemplateQuickAdd({ salonCategories, existingNames, salonId, onAdded, locale }: {
  salonCategories: SalonCategory[];
  existingNames: string[];
  salonId: string | null;
  onAdded: () => void;
  locale: string;
}) {
  const t = useTranslations('dashboard.services');
  const [collapsed, setCollapsed] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  const templates = salonCategories.flatMap((cat) => serviceTemplates[cat] || []);
  if (templates.length === 0) return null;

  const isAdded = (t: ServiceTemplate) => existingNames.includes(t.name_de);

  const addTemplate = async (t: ServiceTemplate) => {
    if (!salonId || isAdded(t)) return;
    setAdding(t.name_de);
    try {
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          name_de: t.name_de,
          name_en: t.name_en,
          category: t.category,
          duration_minutes: t.duration,
          price: t.price,
          is_active: true,
        }),
      });
      onAdded();
      // V3-D334 (overnight T2): error handling per CLAUDE.md.
    } catch (err) { console.error("[Services] add-template failed:", err); }
    setAdding(null);
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full border border-s-border rounded-[14px] px-3.5 py-3 text-[13px] text-s-ink-2 font-medium flex items-center justify-between mb-3.5"
      >
        <span>{collapsed ? t('showTemplates') : t('hideTemplates')}</span>
        <ChevronDown size={16} strokeWidth={1.9} className={`transition-transform ${collapsed ? "" : "rotate-180"}`} />
      </button>
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {templates.map((tmpl) => {
            const added = isAdded(tmpl);
            return (
              <button
                key={`${tmpl.category}-${tmpl.name_de}`}
                type="button"
                disabled={added || adding === tmpl.name_de}
                onClick={() => addTemplate(tmpl)}
                className={[
                  "flex items-center justify-between px-3 py-2.5 rounded-[12px] border text-left transition-[background-color,border-color]",
                  added
                    ? "bg-s-accent-bright/5 border-s-accent-bright/20 opacity-60 cursor-default"
                    : "border-s-border hover:border-s-accent-bright hover:bg-s-accent-bright/5 cursor-pointer",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-s-ink truncate">{tmpl.name_de}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-0.5 text-[12px] text-s-ink/40">
                      <Clock size={10} /> {tmpl.duration} min
                    </span>
                    <span className="text-xs data-text font-semibold text-s-ink-2">{formatCurrency(tmpl.price, locale)}</span>
                  </div>
                </div>
                {adding === tmpl.name_de ? (
                  <Spinner size="sm" />
                ) : added ? (
                  <Check size={14} strokeWidth={1.6} className="text-s-accent-bright shrink-0 ml-2" />
                ) : (
                  <Plus size={14} strokeWidth={1.6} className="text-s-accent-bright shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function ServicesPage() {
  const t = useTranslations('dashboard.services');
  const locale = useLocale();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonCategories, setSalonCategories] = useState<SalonCategory[]>([]);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SalonCategory | "all" | "inactive">("all");
  // Tap-to-expand a row's own details (description, suitable-for), same shape as
  // components-legacy/booking/ServicesStaffStep.tsx:97-105.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Distinct categories present in the services, in first-seen order (for the filter pill row).
  const presentCategories = useMemo(() => {
    const seen: SalonCategory[] = [];
    for (const s of services) if (!seen.includes(s.category)) seen.push(s.category);
    return seen;
  }, [services]);

  // Render-time filter over the already-fetched services (search + category/Inaktiv pill).
  const visibleServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      const matchesFilter =
        categoryFilter === "all" ? true :
        categoryFilter === "inactive" ? s.is_active === false :
        s.category === categoryFilter;
      const matchesQuery =
        !q ||
        s.name_de?.toLowerCase().includes(q) ||
        s.name_en?.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [services, query, categoryFilter]);

  const isFiltered = categoryFilter !== "all" || query.trim() !== "";

  const loadServices = () => {
    fetch("/api/profile").then((r) => r.json()).then((p) => {
      setSalonId(p?.salon_id ?? null);
      setSalonCategories(p?.salon_categories ?? []);
      return fetch(`/api/salon/services?salon_id=${p?.salon_id}&mode=management`).then((r) => r.json());
    }).then((d) => setServices(d?.services ?? [])).catch((err) => console.error("[DashboardServices] Failed to fetch services:", err)).finally(() => setLoading(false));
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
      // V3-D334 (overnight T2): error handling per CLAUDE.md.
    } catch (err) { console.error("[Services] delete failed:", err); } finally { setDeleteLoading(false); }
  };

  const onDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = [...services];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setServices(reordered);
    // Persist sort order
    const order = reordered.map((s, i) => ({ id: s.id, sort_order: i }));
    try {
      await fetch("/api/services/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, order }),
      });
    } catch { /* revert on error */ loadServices(); }
  }, [services, salonId]);

  return (
    <DashboardLayout>
      {(addOpen || editTarget) && salonId && (
        <ServiceModal initial={editTarget ?? undefined} salonId={salonId} salonCategories={salonCategories}
          onClose={() => { setAddOpen(false); setEditTarget(null); }} onSaved={loadServices} onDelete={(s) => setDeleteTarget(s)} />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-sm p-6">
            <h3 className="font-heading text-base mb-3">{t('deleteService')}</h3>
            <p className="text-sm text-s-ink-2 mb-4">{t.rich('deleteConfirm', { name: deleteTarget.name_de, b: (chunks) => <strong>{chunks}</strong> })}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 transition-transform active:scale-[0.97] active:duration-[80ms] active:ease-glide">{t('cancel')}</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-btn bg-s-error text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-[0.97] active:duration-[80ms] active:ease-glide">
                {deleteLoading && <Spinner size="sm" invert />}{t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.02em] text-s-ink leading-none">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-[12px] border border-s-border text-s-ink-2 text-[13px] font-medium hover:border-s-ink transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide">
            <FileUp size={14} strokeWidth={1.6} /> {t('csvImport')}
          </button>
          <button onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 bg-s-ink text-white font-heading font-semibold text-[13px] rounded-[12px] px-3.5 py-2.5 transition-transform active:scale-[0.97] active:duration-[80ms] active:ease-glide">
            <Plus size={15} strokeWidth={1.9} /> {t('add')}
          </button>
        </div>
      </div>

      {/* Template quick-add section */}
      {salonCategories.length > 0 && (
        <TemplateQuickAdd
          salonCategories={salonCategories}
          existingNames={services.map((s) => s.name_de)}
          salonId={salonId}
          onAdded={loadServices}
          locale={locale}
        />
      )}

      {/* Search + filter pills (mobile parity — render-time filter over fetched services) */}
      {services.length > 0 && (
        <>
          <div className="flex items-center gap-2 border border-s-border rounded-[14px] px-3.5 py-2.5 text-s-ink-2 mb-3.5">
            <Search size={17} strokeWidth={1.9} className="shrink-0" />
            {/* mockup-ok: !important prevents a look change, not a new one. The wrapper div
                owns the visible chrome + padding; this input must stay invisible AND compact
                inside it, or the widened base input law (globals.css, 2026-07-17, also sets
                min-height:48px/padding:16px/font-size:16px) paints a second box AND balloons
                the row (V3-D-input-fill-2026-07-17). */}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-1 min-w-0 !border-0 !bg-transparent !min-h-0 !px-0 !text-[13.5px] text-s-ink placeholder:text-s-ink-2 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
            {([
              { key: "all", label: t('filterAll') } as const,
              ...presentCategories.map((c) => ({ key: c, label: CATEGORY_LABELS[c] }) as const),
              { key: "inactive", label: t('filterInactive') } as const,
            ]).map((p) => {
              const active = categoryFilter === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setCategoryFilter(p.key)}
                  className={[
                    "shrink-0 px-3.5 py-2 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide border",
                    active
                      ? "bg-s-accent-bright/10 text-s-accent-bright border-transparent"
                      : "bg-white border-s-border text-s-ink-2",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 text-s-ink/30"><p className="text-sm">{t('emptyNone')}</p></div>
      ) : visibleServices.length === 0 ? (
        <div className="text-center py-12 text-s-ink-2"><p className="text-sm">{t('emptyFiltered')}</p></div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="services-list">
          {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}
            className="rounded-[16px] border border-s-border bg-white overflow-hidden">
            {visibleServices.map((s, index) => (
              <Draggable key={s.id} draggableId={s.id} index={index} isDragDisabled={isFiltered}>
                {(provided, snapshot) => {
                  const isExpanded = expandedIds.has(s.id);
                  const hasSuitableFor = (s.suitable_for?.length ?? 0) > 0;
                  const hasSuitableGender = (s.suitable_gender?.length ?? 0) > 0;
                  const hasDetails = !!s.description_de || !!s.description_en || hasSuitableFor || hasSuitableGender;
                  return (
                <div ref={provided.innerRef} {...provided.draggableProps}
                  // mockup-ok: tap-to-expand restructure reusing the owner-approved booking row
                  // pattern (components-legacy/booking/ServicesStaffStep.tsx:412-501); collapsed
                  // row keeps the same border-b/px-3.5/py-3, only the flex classes moved onto a
                  // nested header div so a details panel can sit below it.
                  className={`border-b border-s-border last:border-b-0 px-3.5 py-3 transition-colors ${snapshot.isDragging ? "bg-s-bg-sunken shadow-warm-md" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span {...provided.dragHandleProps}
                      className="cursor-grab active:cursor-grabbing text-s-ink-2 hover:text-s-ink-2 transition-colors shrink-0"
                      aria-label={t('dragHandle')}>
                      <GripVertical size={20} strokeWidth={2.2} />
                    </span>
                    {hasDetails ? (
                    <button type="button" onClick={() => toggleExpanded(s.id)} aria-expanded={isExpanded}
                      className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <p className="font-heading font-semibold text-[14.5px] text-s-ink truncate">{s.name_de}</p>
                        <ChevronDown size={15} strokeWidth={1.9} className={`shrink-0 text-s-ink-2 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                      {s.name_en && <p className="text-[12px] text-s-ink-2 truncate">{s.name_en}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[12px] font-semibold rounded-md px-2 py-0.5 bg-s-bg-sunken text-s-ink-2">{CATEGORY_LABELS[s.category]}</span>
                      <span className="text-[12.5px] text-s-ink-2">{s.duration_minutes} {t('minutesUnit')} <b className="font-heading font-semibold text-s-ink">{formatCurrency(Number(s.price), locale)}</b></span>
                      </div>
                    </button>
                    ) : (
                      // No details to reveal (no description, no suitable-for/gender): a plain
                      // block, not a button, so no dead chevron affordance (TASTE_LOG.md:253).
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-heading font-semibold text-[14.5px] text-s-ink truncate">{s.name_de}</p>
                        {s.name_en && <p className="text-[12px] text-s-ink-2 truncate">{s.name_en}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[12px] font-semibold rounded-md px-2 py-0.5 bg-s-bg-sunken text-s-ink-2">{CATEGORY_LABELS[s.category]}</span>
                          <span className="text-[12.5px] text-s-ink-2">{s.duration_minutes} {t('minutesUnit')} <b className="font-heading font-semibold text-s-ink">{formatCurrency(Number(s.price), locale)}</b></span>
                        </div>
                      </div>
                    )}
                    {/* mockup-ok: same is_active switch, only re-indented one level to sit
                        inside the new header wrapper div; classes unchanged (see edit above). */}
                    <button
                      type="button"
                      onClick={() => toggleActive(s.id, s.is_active)}
                      role="switch"
                      aria-checked={s.is_active}
                      aria-label={t('active')}
                      className={`relative w-[38px] h-[23px] rounded-full shrink-0 transition-colors ${s.is_active ? "bg-s-accent-bright" : "bg-s-border"}`}>
                      <span className={`absolute top-[2.5px] left-[2.5px] w-[18px] h-[18px] rounded-full bg-white shadow-warm-sm transition-transform ${s.is_active ? "translate-x-[14.5px]" : "translate-x-0"}`} />
                    </button>
                    <button onClick={() => setEditTarget(s)} aria-label={t('edit')} className="text-s-ink shrink-0 grid place-items-center transition-transform active:scale-[0.94] active:duration-[80ms] active:ease-glide">
                      <Pencil size={19} strokeWidth={2.2} />
                    </button>
                  </div>
                  {hasDetails && (
                    <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="pl-8 pt-2 space-y-1">
                          {s.description_de && <p className="text-[13px] text-s-ink-2 leading-relaxed prose-measure">{s.description_de}</p>}
                          {s.description_en && <p className="text-[13px] text-s-ink-2 leading-relaxed prose-measure">{s.description_en}</p>}
                          {hasSuitableFor && (
                            <p className="text-[13px] text-s-ink-2">{t('suitableForLabel')}: {s.suitable_for.map((a) => t(`age_${a}`)).join(", ")}</p>
                          )}
                          {hasSuitableGender && (
                            <p className="text-[13px] text-s-ink-2">{t('genderLabel')}: {s.suitable_gender.map((g) => t(`gender_${g}`)).join(", ")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                  );
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
          )}
        </Droppable>
        </DragDropContext>
      )}

      {/* CSV Import Modal */}
      {importOpen && salonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-heading text-base">{t('csvImport')}</h3>
              <button onClick={() => setImportOpen(false)} className="transition-transform active:scale-[0.94] active:duration-[80ms] active:ease-glide"><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
            </div>
            <p className="text-sm text-s-ink-2 mb-4">
              {t('csvImportHelp')}
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
              const file = fileInput?.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append('file', file);
              fd.append('salon_id', salonId);
              // A15-upload-hardening (2026-07-27): required by the route's CSRF guard, see
              // lib/upload-security.ts requireUploadHeader.
              const res = await fetch('/api/services/import', {
                method: 'POST',
                headers: { 'x-solen-upload': '1' },
                body: fd,
              });
              const data = await res.json();
              if (data.success) {
                setImportOpen(false);
                loadServices();
              } else {
                alert(data.error || t('importFailed'));
              }
            }}>
              <input type="file" accept=".csv,.txt" required
                className="w-full px-3 py-2 rounded-btn border border-s-border text-sm mb-4 file:mr-3 file:px-3 file:py-1 file:rounded-btn file:border-0 file:bg-s-accent-bright/10 file:text-s-accent-bright file:font-medium file:text-xs file:cursor-pointer" />
              <button type="submit"
                className="w-full py-2.5 rounded-btn bg-s-accent-bright text-white text-sm font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.97] active:duration-[80ms] active:ease-glide">
                <Upload size={14} strokeWidth={1.6} /> {t('importButton')}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
