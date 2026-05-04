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
  const t = useTranslations("nail_dashboard") as any;
  const [config, setConfig] = useState<StationConfig>({ total_stations: 1, uv_lamp_count: 1, sterilization_buffer_minutes: 15 });
  const [activeBookings, setActiveBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/salon/stations?salon_id=${salonId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/dashboard/nail/stations/utilization?salon_id=${salonId}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([configData, utilData]) => {
        if (configData?.station) setConfig(configData.station);
        if (typeof utilData?.active_bookings === "number") setActiveBookings(utilData.active_bookings);
      })
      .catch((err) => console.error("[StationManager] failed to load station config and utilization:", err))
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

  if (loading) return <p className="text-sm text-s-ink/40 py-4">{t("loading")}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={16} className="text-s-coral" />
        <h3 className="font-heading text-sm text-s-ink">{t("stations_title")}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-s-ink/60">{t("stations_count")}</span>
          <input
            type="number"
            min={1}
            max={20}
            value={config.total_stations}
            onChange={(e) => setConfig({ ...config, total_stations: parseInt(e.target.value) || 1 })}
            className="mt-1 w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60">{t("stations_uv_lamps")}</span>
          <input
            type="number"
            min={0}
            max={20}
            value={config.uv_lamp_count}
            onChange={(e) => setConfig({ ...config, uv_lamp_count: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-s-ink/60">{t("stations_buffer")}</span>
          <input
            type="number"
            min={0}
            max={60}
            value={config.sterilization_buffer_minutes}
            onChange={(e) => setConfig({ ...config, sterilization_buffer_minutes: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink"
          />
        </label>
      </div>

      {/* Per-station utilization bars */}
      <div className="p-3 rounded-[16px] bg-s-bg-surface space-y-2">
        <div className="flex items-center justify-between text-xs text-s-ink/60">
          <span>{t("stations_utilization")}</span>
          <span>{t("stations_used_of", { used: activeBookings, total: config.total_stations })}</span>
        </div>
        {Array.from({ length: config.total_stations }, (_, i) => {
          const isBooked = i < activeBookings;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-s-ink/40 w-8 shrink-0">#{i + 1}</span>
              <div className="flex-1 h-3 rounded-pill bg-s-ink/10 overflow-hidden flex">
                <div className="h-full bg-s-coral transition-[width] duration-[250ms]" style={{ width: isBooked ? "100%" : "0%" }} />
                {/* Buffer portion calculation skipped for simple boolean state */}
              </div>
              <span className="text-[9px] data-text text-s-ink/30 w-8 text-right">
                {isBooked ? "100%" : "0%"}
              </span>
            </div>
          );
        })}
        {/* Legend */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-s-coral" /><span className="text-[8px] text-s-ink/40">{t("stations_booked")}</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-s-sand-subtle" /><span className="text-[8px] text-s-ink/40">{t("stations_available")}</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-s-ink/10" /><span className="text-[8px] text-s-ink/40">{t("stations_buffer")}</span></div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        aria-label={t("save")}
        className="flex items-center gap-2 px-4 py-2 min-h-12 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-elevation-2"
      >
        <Save size={14} />
        {saving ? t("saving") : t("save")}
      </button>
    </div>
  );
}
