"use client";

import { useState, useEffect } from "react";
import { Save, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

interface StationConfig {
  total_stations: number;
  uv_lamp_count: number;
  sterilization_buffer_minutes: number;
}

export default function StationManager({ salonId }: { salonId: string }) {
  const t = useTranslations("nail_dashboard");
  const [config, setConfig] = useState<StationConfig>({ total_stations: 1, uv_lamp_count: 1, sterilization_buffer_minutes: 15 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/salon/stations?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.station) setConfig(d.station); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/salon/stations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, salon_id: salonId }),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">{t("loading")}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={16} className="text-s-coral" />
        <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">{t("stations_title")}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">{t("stations_count")}</span>
          <input
            type="number"
            min={1}
            max={20}
            value={config.total_stations}
            onChange={(e) => setConfig({ ...config, total_stations: parseInt(e.target.value) || 1 })}
            className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">{t("stations_uv_lamps")}</span>
          <input
            type="number"
            min={0}
            max={20}
            value={config.uv_lamp_count}
            onChange={(e) => setConfig({ ...config, uv_lamp_count: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60">{t("stations_buffer")}</span>
          <input
            type="number"
            min={0}
            max={60}
            value={config.sterilization_buffer_minutes}
            onChange={(e) => setConfig({ ...config, sterilization_buffer_minutes: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
          />
        </label>
      </div>

      {/* Utilization bar */}
      <div className="p-3 rounded-card bg-s-bg-surface dark:bg-s-dm-bg">
        <div className="flex items-center justify-between text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1">
          <span>{t("stations_utilization")}</span>
          <span>{t("stations_used_of", { used: 0, total: config.total_stations })}</span>
        </div>
        <div className="h-2 rounded-full bg-s-ink/10 dark:bg-s-dm-text/10">
          <div className="h-full rounded-full bg-s-sage" style={{ width: "0%" }} />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        aria-label={t("save")}
        className="flex items-center gap-2 px-4 py-2 min-h-12 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral-hover transition-colors disabled:opacity-50"
      >
        <Save size={14} />
        {saving ? t("saving") : t("save")}
      </button>
    </div>
  );
}
