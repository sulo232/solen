"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";

interface ZonePackage {
  id: string;
  name: string;
  zones: string[];
  discount_percent: number;
}

const ZONE_OPTIONS = [
  "full_legs",
  "half_legs_upper",
  "half_legs_lower",
  "bikini",
  "brazilian",
  "underarms",
  "full_arms",
  "half_arms",
  "full_face",
  "upper_lip",
  "chin",
  "back",
  "chest",
  "stomach",
];

interface ZonePackagesProps {
  salonId: string;
}

export default function ZonePackages({ salonId }: ZonePackagesProps) {
  const t = useTranslations("dashboardWaxing") as any;
  const [packages, setPackages] = useState<ZonePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    zones: [] as string[],
    discount_percent: 10,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/salon/waxing-zone-packages?salon_id=${salonId}`);
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled) setPackages(d.packages ?? []);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [salonId]);

  const toggleFormZone = (zone: string) => {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter((z) => z !== zone)
        : [...prev.zones, zone],
    }));
  };

  const addPackage = async () => {
    if (!form.name || form.zones.length === 0) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/salon/waxing-zone-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, ...form }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? t("save_error"));
        return;
      }
      const { package: pkg } = await res.json();
      setPackages((prev) => [...prev, pkg]);
      setForm({ name: "", zones: [], discount_percent: 10 });
      setShowForm(false);
    } catch {
      setError(t("save_error"));
    } finally {
      setSaving(false);
    }
  };

  const removePackage = async (id: string) => {
    if (!window.confirm(t("confirm_remove"))) return;
    setDeleting(id);
    const previous = [...packages];
    setPackages((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch("/api/salon/waxing-zone-packages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setPackages(previous);
      setError(t("delete_error"));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="flex justify-center py-4"><Spinner size="sm" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("zone_packages")}
        </p>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          aria-label={t("add_package")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] shadow-coral-glow transition-[transform,filter] duration-150"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? t("cancel") : t("add_package")}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-s-coral mb-3">{error}</p>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] p-4 mb-4 bg-[--raised] space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("package_name_placeholder")}
            aria-label={t("package_name_placeholder")}
            className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.06] bg-transparent text-sm text-s-ink"
          />

          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 mb-1 block">
              {t("select_zones")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ZONE_OPTIONS.map((zone) => (
                <button
                  key={zone}
                  onClick={() => toggleFormZone(zone)}
                  aria-label={t(`zones.${zone}` as any)}
                  className={`rounded-[8px] border px-2 py-1 text-[10px] font-heading font-semibold transition-colors duration-150 ${
                    form.zones.includes(zone)
                      ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                      : "border-s-ink/[0.06] text-s-ink/40"
                  }`}
                >
                  {t(`zones.${zone}` as any)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 mb-1 block">
              {t("discount_percent")}
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: Math.max(1, Math.min(50, Number(e.target.value))) })}
              aria-label={t("discount_percent")}
              className="w-20 px-3 py-2 rounded-[8px] border border-s-ink/[0.06] bg-transparent text-sm text-s-ink text-center"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={addPackage}
              disabled={saving || !form.name || form.zones.length === 0}
              aria-label={t("save")}
              className="px-4 py-1.5 rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] shadow-coral-glow transition-[transform,filter] duration-150 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving && <Spinner size="sm" invert />}
              {t("save")}
            </button>
          </div>
        </div>
      )}

      {/* Package list */}
      <div className="rounded-[12px] border border-s-ink/[0.06] p-4 bg-[--raised]">
        <div className="flex items-center gap-2 mb-3">
          <Package size={14} className="text-s-coral" />
          <span className="text-xs font-heading font-semibold text-s-ink">
            {t("zone_packages")}
          </span>
        </div>
        {packages.length === 0 ? (
          <p className="text-xs text-s-ink/30 text-center py-4">
            {t("no_packages")}
          </p>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between py-3 border-b border-s-ink/[0.04] last:border-0"
            >
              <div>
                <p className="text-sm font-heading font-semibold text-s-ink">
                  {pkg.name}
                </p>
                <p className="text-[10px] text-s-ink/40">
                  {pkg.zones.map((z) => t(`zones.${z}` as any)).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-heading font-bold bg-s-coral/10 text-s-coral px-2 py-0.5 rounded-[6px]">
                  -{pkg.discount_percent}%
                </span>
                <button
                  onClick={() => removePackage(pkg.id)}
                  disabled={deleting === pkg.id}
                  aria-label={t("remove")}
                  className="text-s-ink/20 hover:text-s-coral transition-colors duration-150 disabled:opacity-40"
                >
                  {deleting === pkg.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
