"use client";

import { useState } from "react";
import { Package, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("dashboardWaxing");
  const [packages, setPackages] = useState<ZonePackage[]>([
    {
      id: "preset-full",
      name: "Full Body",
      zones: ZONE_OPTIONS,
      discount_percent: 20,
    },
    {
      id: "preset-lower",
      name: "Lower Body",
      zones: ["full_legs", "bikini", "half_legs_lower"],
      discount_percent: 10,
    },
    {
      id: "preset-face",
      name: "Face Package",
      zones: ["full_face", "upper_lip", "chin"],
      discount_percent: 15,
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    zones: [] as string[],
    discount_percent: 10,
  });

  const toggleFormZone = (zone: string) => {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter((z) => z !== zone)
        : [...prev.zones, zone],
    }));
  };

  const addPackage = () => {
    if (!form.name || form.zones.length === 0) return;
    setPackages((prev) => [
      ...prev,
      { id: `pkg-${Date.now()}`, ...form },
    ]);
    setForm({ name: "", zones: [], discount_percent: 10 });
    setShowForm(false);
  };

  const removePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("zone_packages")}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          aria-label={t("add_package")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? t("cancel") : t("add_package")}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 mb-4 bg-white dark:bg-s-dm-surface space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("package_name_placeholder")}
            aria-label={t("package_name_placeholder")}
            className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-transparent text-sm text-s-ink dark:text-s-dm-text"
          />

          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">
              {t("select_zones")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ZONE_OPTIONS.map((zone) => (
                <button
                  key={zone}
                  onClick={() => toggleFormZone(zone)}
                  aria-label={t(`zones.${zone}`)}
                  className={`rounded-[8px] border px-2 py-1 text-[10px] font-heading font-semibold transition-colors duration-150 ${
                    form.zones.includes(zone)
                      ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                      : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/40 dark:text-s-dm-text/40"
                  }`}
                >
                  {t(`zones.${zone}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-1 block">
              {t("discount_percent")}
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.discount_percent}
              onChange={(e) =>
                setForm({ ...form, discount_percent: Number(e.target.value) })
              }
              aria-label={t("discount_percent")}
              className="w-20 px-3 py-2 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-transparent text-sm text-s-ink dark:text-s-dm-text text-center"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={addPackage}
              disabled={!form.name || form.zones.length === 0}
              aria-label={t("save")}
              className="px-4 py-1.5 rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {t("save")}
            </button>
          </div>
        </div>
      )}

      {/* Package list */}
      <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface">
        <div className="flex items-center gap-2 mb-3">
          <Package size={14} className="text-s-coral" />
          <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">
            {t("zone_packages")}
          </span>
        </div>
        {packages.length === 0 ? (
          <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-4">
            {t("no_packages")}
          </p>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0"
            >
              <div>
                <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">
                  {pkg.name}
                </p>
                <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
                  {pkg.zones.map((z) => t(`zones.${z}`)).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-heading font-bold bg-s-coral/10 text-s-coral px-2 py-0.5 rounded-[6px]">
                  -{pkg.discount_percent}%
                </span>
                <button
                  onClick={() => removePackage(pkg.id)}
                  aria-label={t("remove")}
                  className="text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-error transition-colors duration-150"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
