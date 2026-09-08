"use client";

// exists-check: `npm run exists bundles` (2026-07-03, A5 Phase B-2) confirms the
// service_bundles table + the public GET /api/salon/bundles + the PDP SalonBundles.tsx
// section already ship; the owner CRUD (app/api/salon/bundles/route.ts POST/PATCH/DELETE)
// was added alongside this page in the same pass. This page is the real dashboard-side
// bundle builder, promoted from the APPROVED mockup app/[locale]/dev/bundle-builder/page.tsx
// (owner approved 2026-07-03, see _plans/BUNDLES_PRODUCTS.md B-2).
//
// Grounded-in:
//   - Dashboard chrome + h1/list/panel grammar: app/[locale]/dashboard/services/page.tsx
//     (DashboardLayout wrap, h1 treatment, rounded-[16px] border-s-border white list panel,
//     ink Save button, border-s-border Cancel button , the LIVE/shipped Save convention on
//     this dashboard).
//   - Active toggle: the LOCKED <Switch> primitive (app/[locale]/_components/primitives/Switch.tsx,
//     bg-s-ink on-state) rather than the services page's older hand-rolled accent-bright toggle
//     , the primitive is the single source of truth for on/off state and avoids the
//     black/blue-selected drift the owner has repeatedly flagged for CHOICE/selection UI (this
//     is a genuine on/off commit-adjacent control, which the Switch primitive already models).
//   - Inputs: NO per-input focus override , the GLOBAL focus-visible recipe in app/globals.css
//     (single ink edge + halo) applies automatically, matching the locked convention (primitives
//     add no extra outline/ring, V3-D449).
//   - Form fields (name input, >=2 service checkbox picker, sum/percent/custom segmented,
//     percent/custom value field, Active toggle, Save/Cancel): the APPROVED
//     app/[locale]/dev/bundle-builder/page.tsx mockup, ported to real data + real save. Segmented
//     control selected-state uses gray-sunken (bg-s-bg-sunken + text-s-ink), NOT accent/blue,
//     per feedback_selected_state_ink_not_blue_ring.
//   - Live preview panel: the REAL customer BundleCard grammar copied 1:1 from
//     app/[locale]/_components/salon/SalonBundles.tsx (Package icon + name, IncludedRow
//     name + Clock duration in "N min" casing, struck summed price, bold bundle price,
//     pale-green -X% pill), wired to the SAME lib/pricing/bundle.ts computeBundlePriceChf
//     the live API uses, so the preview price is provably the same number the API computes.
//   - Loading = <Skeleton>, empty = <EmptyState>, error = <ErrorState> (locked primitives,
//     app/[locale]/_components/primitives/Skeleton.tsx + components-legacy/ui/EmptyState.tsx
//     + components-legacy/ui/ErrorState.tsx), matching the project convention.
//
// i18n: messages/{de,en,fr,it}.json dashboard.bundles namespace (added this pass).

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, X, Clock, Info, Package } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import EmptyState from "@/components-legacy/ui/EmptyState";
import ErrorState from "@/components-legacy/ui/ErrorState";
import { Skeleton, Switch } from "@/app/[locale]/_components/primitives";
import { formatCurrency } from "@/lib/format-currency";
import { computeBundlePriceChf, type BundlePricingMode } from "@/lib/pricing/bundle";
import type { Service } from "@/lib/types";
import { localizedField } from "@/lib/i18n/localized-field";

// ── Shapes returned by the owner CRUD + GET routes ──

interface BundleListItem {
  id: string;
  name: string;
  pricing_mode: BundlePricingMode;
  percent_off: number | null;
  is_active: boolean;
  services: { id: string; name_de: string; name_en: string | null; price: number; duration_minutes: number }[];
  sum_price: number;
  bundle_price: number;
}

const PRICING_MODES: BundlePricingMode[] = ["sum", "percent", "custom"];
const PRICING_MODE_KEY: Record<BundlePricingMode, "pricingModeSum" | "pricingModePercent" | "pricingModeCustom"> = {
  sum: "pricingModeSum",
  percent: "pricingModePercent",
  custom: "pricingModeCustom",
};
const inputClass = "w-full px-3 py-2 text-sm"; // mockup-ok: dead-class removal only, base input law already renders this fill/border/radius (V3-D-input-fill-2026-07-17)

// ─────────────────────────────────────────
// Builder form (create or edit)
// ─────────────────────────────────────────

function BundleForm({
  initial,
  salonId,
  services,
  locale,
  onClose,
  onSaved,
  onDelete,
}: {
  initial?: BundleListItem;
  salonId: string;
  services: Service[];
  locale: string;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: (b: BundleListItem) => void;
}) {
  const t = useTranslations("dashboard.bundles");
  const [name, setName] = useState(initial?.name ?? "");
  // B-2 council FIX-4: seed selectedIds from initial.services, but FILTER to only ids
  // present in the active `services` picker list. The picker only shows is_active
  // services, so an unfiltered seed would leave a deactivated service invisibly
  // selected and silently re-save it on every edit. The RPC also now REJECTS inactive
  // services (BUNDLE_SERVICE_INVALID), so an un-dropped stale id would 400 the save ,
  // filtering here on form init prevents that surprise and matches what the owner
  // can actually see in the picker.
  const activeServiceIds = new Set(services.map((s) => s.id));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set((initial?.services.map((s) => s.id) ?? []).filter((id) => activeServiceIds.has(id))),
  );
  const [mode, setMode] = useState<BundlePricingMode>(initial?.pricing_mode ?? "percent");
  const [percentOff, setPercentOff] = useState(initial?.percent_off ?? 15);
  const [customPrice, setCustomPrice] = useState(initial?.bundle_price ?? 0);
  // ?mine=true returns the bundle's real is_active flag now (B-2 council FIX-3), so an
  // edit target seeds the toggle from that instead of assuming "reached via the list
  // means active". New bundles still default OFF (never silently publish a
  // half-filled-in bundle).
  const [isActive, setIsActive] = useState(initial?.is_active ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedServices = services.filter((s) => selectedIds.has(s.id));
  const enoughServices = selectedServices.length >= 2;
  const sumChf = selectedServices.reduce((acc, s) => acc + Number(s.price), 0);
  const priceChf = computeBundlePriceChf(mode, sumChf, { customPrice, percentOff });
  const showStruck = enoughServices && priceChf < sumChf;
  const showDiscount = mode === "percent" && enoughServices;

  const handleSave = async () => {
    if (!name.trim() || !enoughServices) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        id: initial?.id,
        name: name.trim(),
        service_ids: [...selectedIds],
        pricing_mode: mode,
        custom_price: mode === "custom" ? customPrice : undefined,
        percent_off: mode === "percent" ? percentOff : undefined,
        is_active: isActive,
      };
      const res = await fetch("/api/salon/bundles", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initial ? body : { ...body, salon_id: salonId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[BundleForm] save failed:", res.status, err);
        setError(err.message || t("saveFailed"));
        return;
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("[BundleForm] save failed:", err);
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-3xl p-6 my-auto">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base">{initial ? t("editBundle") : t("addBundle")}</h3>
          <button onClick={onClose} aria-label={t("cancel")}>
            <X size={18} strokeWidth={1.9} className="text-s-ink/30" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
          {/* ── Form fields ── */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("nameLabel")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">
                {t("servicesLabel", { count: selectedServices.length })}
              </label>
              <div className="overflow-hidden rounded-[12px] border border-s-border max-h-64 overflow-y-auto">
                {services.map((s, i) => {
                  const checked = selectedIds.has(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-[13.5px] transition-colors ${
                        i > 0 ? "border-t border-s-border" : ""
                      } ${checked ? "bg-s-bg-sunken" : "bg-white hover:bg-s-bg-sunken"}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(s.id)}
                          className="h-4 w-4 shrink-0 accent-s-ink"
                        />
                        <div className="min-w-0">
                          <p className={`truncate text-s-ink ${checked ? "font-semibold" : "font-medium"}`}>
                            {localizedField(s as unknown as Record<string, unknown>, "name", locale) || s.name_de}
                          </p>
                          <p className="flex items-center gap-1 text-[12px] text-s-ink-2">
                            <Clock size={11} strokeWidth={1.9} /> {s.duration_minutes} min
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-semibold text-s-ink tabular-nums">
                        {formatCurrency(Number(s.price), locale)}
                      </span>
                    </label>
                  );
                })}
              </div>
              {!enoughServices && (
                <p className="mt-1.5 flex items-center gap-1 text-[12px] text-s-warning-text">
                  <Info size={12} strokeWidth={2} /> {t("servicesHint")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("pricingModeLabel")}</label>
              <div className="grid grid-cols-3 gap-2">
                {PRICING_MODES.map((m) => {
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      aria-pressed={active}
                      className={`flex items-center justify-center rounded-[10px] border px-2 py-2.5 text-[13px] font-semibold transition-colors ${
                        active
                          ? "border-s-border bg-s-bg-sunken text-s-ink"
                          : "border-s-border text-s-ink-2 hover:border-s-ink/20"
                      }`}
                    >
                      {t(PRICING_MODE_KEY[m])}
                    </button>
                  );
                })}
              </div>
            </div>

            {mode === "percent" && (
              <div>
                <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("percentOffLabel")}</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={percentOff}
                    onChange={(e) => setPercentOff(Math.min(99, Math.max(1, Number(e.target.value) || 0)))}
                    className={inputClass}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-s-ink-2">%</span>
                </div>
              </div>
            )}

            {mode === "custom" && (
              <div>
                <label className="block text-xs font-medium text-s-ink-2 mb-1">{t("customPriceLabel")}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-s-ink-2">CHF</span>
                  <input
                    type="number"
                    min={0}
                    step={0.05}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>
            )}

            {mode === "sum" && (
              <p className="rounded-[10px] bg-s-bg-sunken px-3 py-2.5 text-[12.5px] text-s-ink-2">{t("sumHint")}</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-sm text-s-ink-2">{t("active")}</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} aria-label={t("active")} />
            </div>

            {error && <p className="text-[12.5px] text-s-error">{error}</p>}

            <div className="flex gap-2 items-center pt-1">
              {initial && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(initial);
                  }}
                  aria-label={t("delete")}
                  className="text-s-ink-2 hover:text-s-error transition-colors grid place-items-center px-1.5 py-2.5"
                >
                  <Trash2 size={18} strokeWidth={1.9} />
                </button>
              )}
              <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2">
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || !enoughServices || saving}
                className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Spinner size="sm" invert />}
                {t("save")}
              </button>
            </div>
          </div>

          {/* ── Live preview (real customer BundleCard grammar) ── */}
          <div>
            <p className="mb-2.5 text-[12.5px] font-semibold text-s-ink-2">{t("previewTitle")}</p>
            <div className="rounded-[20px] bg-s-bg-sunken p-3">
              {enoughServices ? (
                <div className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
                  <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                    <Package size={16} strokeWidth={1.9} className="text-s-ink" aria-hidden />
                    <p className="font-heading text-[16px] font-bold text-s-ink">{name || t("namePlaceholder")}</p>
                  </div>
                  <div>
                    {selectedServices.map((s) => (
                      <div key={s.id} className="flex items-center justify-between border-t border-s-border px-4 py-3 first:border-t-0">
                        <p className="truncate font-body text-[14px] font-medium text-s-ink">
                          {localizedField(s as unknown as Record<string, unknown>, "name", locale) || s.name_de}
                        </p>
                        <span className="flex shrink-0 items-center gap-1 pl-3 text-[12px] text-s-ink-2 tabular-nums">
                          <Clock size={11} strokeWidth={1.9} aria-hidden /> {s.duration_minutes} min
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-s-border px-4 py-3.5">
                    <div className="flex min-w-0 items-baseline gap-2">
                      {showStruck && (
                        <span className="font-body text-[13px] text-s-ink-2 line-through tabular-nums">
                          {formatCurrency(sumChf, locale)}
                        </span>
                      )}
                      <span className="font-body text-[16px] font-bold text-s-ink tabular-nums">
                        {formatCurrency(priceChf, locale)}
                      </span>
                      {showDiscount && (
                        <span className="rounded-full bg-s-success-bg px-2.5 py-1 font-body text-[12px] font-semibold text-s-success tabular-nums">
                          &minus;{percentOff}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-s-border bg-white p-6 text-center">
                  <p className="text-[13px] text-s-ink-2">{t("previewEmpty")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function BundlesPage() {
  const t = useTranslations("dashboard.bundles");
  const locale = useLocale();
  const [salonId, setSalonId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bundles, setBundles] = useState<BundleListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editTarget, setEditTarget] = useState<BundleListItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BundleListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        const sid = p?.salon_id ?? null;
        setSalonId(sid);
        if (!sid) return Promise.resolve(null);
        return Promise.all([
          fetch(`/api/services?salon_id=${sid}`).then((r) => r.json()),
          // B-2 council FIX-3: ?mine=true is the OWNER-scoped list (admin client, all
          // bundles for the caller's own salon regardless of is_active). The public GET
          // is RLS active-only, so a bundle saved Inactive (new bundles default OFF)
          // used to vanish from the owner's own list , unmanageable.
          fetch(`/api/salon/bundles?salon_id=${sid}&mine=true`).then((r) => r.json()),
        ]);
      })
      .then((res) => {
        if (!res) {
          setServices([]);
          setBundles([]);
          return;
        }
        const [servicesRes, bundlesRes] = res as [{ services?: Service[] }, { bundles?: BundleListItem[] }];
        setServices((servicesRes?.services ?? []).filter((s) => s.is_active));
        const list = bundlesRes?.bundles ?? [];
        setBundles(list);
        // ?mine=true returns every bundle for this salon with its real is_active flag
        // (see BundleListItem.is_active), so the toggle UI reflects the true state
        // instead of "present in an active-only list = active".
        setActiveIds(new Set(list.filter((b) => b.is_active).map((b) => b.id)));
      })
      .catch((err) => {
        console.error("[DashboardBundles] failed to load:", err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/salon/bundles?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[DashboardBundles] delete failed:", res.status, err);
        return;
      }
      setBundles((prev) => (prev ? prev.filter((b) => b.id !== deleteTarget.id) : prev));
      setDeleteTarget(null);
    } catch (err) {
      console.error("[DashboardBundles] delete failed:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleActive = async (bundle: BundleListItem) => {
    setTogglingId(bundle.id);
    const nextActive = !activeIds.has(bundle.id);
    try {
      const res = await fetch("/api/salon/bundles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bundle.id,
          name: bundle.name,
          service_ids: bundle.services.map((s) => s.id),
          pricing_mode: bundle.pricing_mode,
          custom_price: bundle.pricing_mode === "custom" ? bundle.bundle_price : undefined,
          percent_off: bundle.pricing_mode === "percent" ? bundle.percent_off ?? undefined : undefined,
          is_active: nextActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[DashboardBundles] toggle active failed:", res.status, err);
        return;
      }
      load();
    } catch (err) {
      console.error("[DashboardBundles] toggle active failed:", err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <DashboardLayout>
      {(addOpen || editTarget) && salonId && (
        <BundleForm
          initial={editTarget ?? undefined}
          salonId={salonId}
          services={services}
          locale={locale}
          onClose={() => {
            setAddOpen(false);
            setEditTarget(null);
          }}
          onSaved={load}
          onDelete={(b) => setDeleteTarget(b)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[12px] shadow-warm-lg w-full max-w-sm p-6">
            <h3 className="font-heading text-base mb-3">{t("deleteBundle")}</h3>
            <p className="text-sm text-s-ink-2 mb-4">
              {t.rich("deleteConfirm", { name: deleteTarget.name, b: (chunks) => <strong>{chunks}</strong> })}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2">
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-btn bg-s-error text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading && <Spinner size="sm" invert />}
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.02em] text-s-ink leading-none">{t("title")}</h1>
        <button
          onClick={() => setAddOpen(true)}
          disabled={!salonId || services.length < 2}
          className="inline-flex items-center gap-1.5 bg-s-ink text-white font-heading font-semibold text-[13px] rounded-[12px] px-3.5 py-2.5 disabled:opacity-50"
        >
          <Plus size={15} strokeWidth={1.9} /> {t("add")}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={72} rounded={16} />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState title={t("errorTitle")} message={t("errorMessage")} onRetry={load} retryLabel={t("retry")} />
      ) : !bundles || bundles.length === 0 ? (
        <EmptyState icon={Package} title={t("emptyTitle")} message={t("emptyMessage")} />
      ) : (
        <div className="rounded-[16px] border border-s-border bg-white overflow-hidden">
          {bundles.map((b) => {
            const isActive = activeIds.has(b.id);
            return (
              <div key={b.id} className="border-b border-s-border last:border-b-0 flex items-center gap-3 px-3.5 py-3">
                <div className="w-10 h-10 rounded-[10px] bg-s-bg-sunken flex items-center justify-center shrink-0">
                  <Package size={16} strokeWidth={1.9} className="text-s-ink-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-[14.5px] text-s-ink truncate">{b.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[12px] font-semibold rounded-md px-2 py-0.5 bg-s-bg-sunken text-s-ink-2">
                      {t("itemsCount", { count: b.services.length })}
                    </span>
                    <span className="text-[12.5px] text-s-ink-2">
                      <b className="font-heading font-semibold text-s-ink">{formatCurrency(b.bundle_price, locale)}</b>
                    </span>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggleActive(b)}
                  disabled={togglingId === b.id}
                  aria-label={t("active")}
                />
                <button onClick={() => setEditTarget(b)} aria-label={t("edit")} className="text-s-ink shrink-0 grid place-items-center">
                  <Pencil size={19} strokeWidth={2.2} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
