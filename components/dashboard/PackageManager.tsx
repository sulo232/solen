"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Package, ToggleLeft, ToggleRight } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface ServicePackage {
  id: string;
  name: string;
  service_name: string;
  sessions: number;
  bonus_sessions: number;
  price: number;
  is_active: boolean;
  purchases_count: number;
}

interface PackagePurchase {
  id: string;
  customer_name: string;
  package_name: string;
  sessions_used: number;
  sessions_total: number;
  purchased_at: string;
}

interface PackageManagerProps {
  salonId: string;
}

export default function PackageManager({ salonId }: PackageManagerProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard.packages") as any;
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [purchases, setPurchases] = useState<PackagePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({ name: "", service_id: "", sessions: 5, bonus_sessions: 1, price: 0 });

  useEffect(() => {
    Promise.allSettled([
      fetch(`/api/packages?salon_id=${salonId}`),
      fetch(`/api/packages/purchase?salon_id=${salonId}`),
      fetch(`/api/salon/services?salon_id=${salonId}`),
    ])
      .then(async ([pkgResult, purchaseResult, svcResult]) => {
        if (pkgResult.status === "fulfilled" && pkgResult.value.ok) {
          const d = await pkgResult.value.json().catch(() => ({}));
          setPackages(d.packages ?? d.items ?? []);
        }
        if (purchaseResult.status === "fulfilled" && purchaseResult.value.ok) {
          const d = await purchaseResult.value.json().catch(() => ({}));
          setPurchases(d.purchases ?? d.items ?? []);
        }
        if (svcResult.status === "fulfilled" && svcResult.value.ok) {
          const d = await svcResult.value.json().catch(() => ({}));
          setServices(
            (d.services ?? d.items ?? []).map((s: { id: string; name_de?: string; name?: string }) => ({
              id: s.id,
              name: s.name_de ?? s.name ?? "",
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [salonId]);

  const handleCreate = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.service_id) return;
    if (form.sessions < 1) {
      setFormError(t("priceMinError"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, ...form }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error ?? d.message ?? t("createError"));
        return;
      }
      const newPkg = await res.json();
      setPackages((prev) => [...prev, newPkg]);
      setShowForm(false);
      setForm({ name: "", service_id: "", sessions: 5, bonus_sessions: 1, price: 0 });
    } catch {
      setFormError(t("createError"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg: ServicePackage) => {
    // Optimistic update
    const previousPackages = [...packages];
    setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, is_active: !p.is_active } : p)));
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !pkg.is_active }),
      });
      if (!res.ok) throw new Error("toggle failed");
    } catch {
      // Revert on failure
      setPackages(previousPackages);
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm text-s-ink flex items-center gap-2">
          <Package size={14} className="text-s-coral" /> {t("title")}
        </h3>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(null); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150"
        >
          <Plus size={12} /> {t("newPkg")}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-s-bg-surface rounded-[16px] border border-s-ink/5 p-4 mb-4 space-y-3">
          <input
            value={form.name}
            onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormError(null); }}
            placeholder={t("namePlaceholder")}
            className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
          />
          <select
            value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}
            className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
          >
            <option value="">{t("selectService")}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-s-ink/40">{t("sessions")}</label>
              <input
                type="number"
                min={1}
                value={form.sessions}
                onChange={(e) => setForm({ ...form, sessions: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
              />
            </div>
            <div>
              <label className="text-[10px] text-s-ink/40">{t("bonus")}</label>
              <input
                type="number"
                min={0}
                value={form.bonus_sessions}
                onChange={(e) => setForm({ ...form, bonus_sessions: Math.max(0, Number(e.target.value)) })}
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
              />
            </div>
            <div>
              <label className="text-[10px] text-s-ink/40">{t("price")}</label>
              <input
                type="number"
                min={0}
                step={5}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Math.max(0, Number(e.target.value)) })}
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
              />
            </div>
          </div>
          {formError && <p role="alert" className="text-xs text-s-coral">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="px-3 py-1.5 text-xs text-s-ink/50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim() || !form.service_id}
              className="px-4 py-1.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] disabled:opacity-50 shadow-elevation-2 transition-[transform,filter] duration-150"
            >
              {saving ? t("saving") : t("create")}
            </button>
          </div>
        </div>
      )}

      {/* Package list */}
      {packages.length === 0 ? (
        <p className="text-xs text-s-ink/30 text-center py-6">{t("empty")}</p>
      ) : (
        <div className="space-y-2 mb-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between bg-s-bg-surface/50 rounded-[16px] border border-s-ink/5 p-3"
            >
              <div>
                <p className="text-sm font-medium text-s-ink">{pkg.name}</p>
                <p className="text-xs text-s-ink/40">
                  {pkg.sessions} + {pkg.bonus_sessions} {t("bonus")} · {pkg.service_name} · {pkg.purchases_count} {t("sold")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="data-text text-sm font-semibold text-s-ink">
                  {formatCurrency(pkg.price, locale)}
                </span>
                <button
                  onClick={() => toggleActive(pkg)}
                  aria-label={pkg.is_active ? t("deactivate") : t("activate")}
                  className="text-s-ink/30 hover:text-s-coral transition-colors"
                >
                  {pkg.is_active
                    ? <ToggleRight size={20} className="text-s-coral" />
                    : <ToggleLeft size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchases */}
      {purchases.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-s-ink/40 uppercase tracking-wide mb-2">
            {t("recentPurchases")}
          </h4>
          <div className="space-y-1">
            {purchases.slice(0, 10).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-s-ink/5 last:border-0"
              >
                <span className="text-s-ink font-medium">{p.customer_name}</span>
                <span className="text-s-ink/40">{p.package_name}</span>
                <span className="data-text text-s-ink">
                  {p.sessions_used}/{p.sessions_total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
