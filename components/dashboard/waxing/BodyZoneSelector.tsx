"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Footprints,
  Shield,
  CircleDot,
  Hand,
  Smile,
  Eye,
  Shirt,
  ArrowDown,
  User,
  Check,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import BodyDiagram from "@/components/shared/BodyDiagram";

interface WaxingZone {
  key: string;
  labelKey: string;
  icon: LucideIcon;
}

const WAXING_ZONES: WaxingZone[] = [
  { key: "full_legs", labelKey: "zones.full_legs", icon: Footprints },
  { key: "half_legs_upper", labelKey: "zones.half_legs_upper", icon: ArrowDown },
  { key: "half_legs_lower", labelKey: "zones.half_legs_lower", icon: Footprints },
  { key: "bikini", labelKey: "zones.bikini", icon: Shield },
  { key: "brazilian", labelKey: "zones.brazilian", icon: Shield },
  { key: "underarms", labelKey: "zones.underarms", icon: CircleDot },
  { key: "full_arms", labelKey: "zones.full_arms", icon: Hand },
  { key: "half_arms", labelKey: "zones.half_arms", icon: Hand },
  { key: "full_face", labelKey: "zones.full_face", icon: Smile },
  { key: "upper_lip", labelKey: "zones.upper_lip", icon: Eye },
  { key: "chin", labelKey: "zones.chin", icon: Smile },
  { key: "back", labelKey: "zones.back", icon: User },
  { key: "chest", labelKey: "zones.chest", icon: Shirt },
  { key: "stomach", labelKey: "zones.stomach", icon: CircleDot },
];

const WAX_TYPES = ["hard_wax", "strip_wax", "sugaring"] as const;
type WaxType = (typeof WAX_TYPES)[number];

interface Preset {
  labelKey: string;
  zones: string[];
}

const PRESETS: Preset[] = [
  { labelKey: "presets.full_body", zones: WAXING_ZONES.map((z) => z.key) },
  {
    labelKey: "presets.lower_body",
    zones: ["full_legs", "bikini", "half_legs_lower"],
  },
  {
    labelKey: "presets.face_package",
    zones: ["full_face", "upper_lip", "chin"],
  },
];

interface BodyZoneSelectorProps {
  salonId: string;
  clientId: string;
}

export default function BodyZoneSelector({
  salonId,
  clientId,
}: BodyZoneSelectorProps) {
  const t = useTranslations("dashboardWaxing") as any;
  const [selected, setSelected] = useState<string[]>([]);
  const [waxPrefs, setWaxPrefs] = useState<Record<string, WaxType>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [visualMode, setVisualMode] = useState(false);

  useEffect(() => {
    fetch(
      `/api/dashboard/waxing/zone-preferences?salon_id=${salonId}&client_id=${clientId}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.data) {
          setSelected(d.data.zones_selected ?? []);
          setWaxPrefs(d.data.wax_type_preferences ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [salonId, clientId]);

  const toggleZone = useCallback((key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((z) => z !== key) : [...prev, key]
    );
  }, []);

  const applyPreset = useCallback((zones: string[]) => {
    setSelected(zones);
  }, []);

  const setWaxType = useCallback((zone: string, type: WaxType) => {
    setWaxPrefs((prev) => ({ ...prev, [zone]: type }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/dashboard/waxing/zone-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          client_id: clientId,
          zones_selected: selected,
          wax_type_preferences: waxPrefs,
        }),
      });
    } catch {}
    setSaving(false);
  };

  if (!loaded)
    return (
      <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">
        {t("loading")}
      </p>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("zone_selector")}
        </p>
        <button
          onClick={() => setVisualMode(!visualMode)}
          className={`rounded-[8px] border px-3 py-1.5 text-[10px] font-heading font-semibold transition-colors duration-150 ${
            visualMode
              ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
              : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/40 dark:text-s-dm-text/40"
          }`}
          aria-label={t(visualMode ? "text_mode" : "visual_mode")}
        >
          {t(visualMode ? "text_mode" : "visual_mode")}
        </button>
      </div>

      {/* Visual Mode: Body Diagram */}
      {visualMode && (
        <div className="mb-4">
          <BodyDiagram
            selectedZones={selected}
            onZoneSelect={(zoneId, sel) => {
              setSelected((prev) =>
                sel ? [...prev, zoneId] : prev.filter((z) => z !== zoneId)
              );
            }}
            mode="waxing"
          />
        </div>
      )}

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.labelKey}
            onClick={() => applyPreset(preset.zones)}
            aria-label={t(preset.labelKey as any)}
            className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] px-3 py-1.5 text-[10px] font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50 transition-colors duration-150 hover:border-s-coral/40 hover:text-s-coral"
          >
            {t(preset.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Zone grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {WAXING_ZONES.map((zone) => {
          const isSelected = selected.includes(zone.key);
          return (
            <button
              key={zone.key}
              onClick={() => toggleZone(zone.key)}
              aria-label={t(zone.labelKey as any)}
              className={`rounded-[12px] border p-3 flex items-center gap-3 transition-colors duration-150 ${
                isSelected
                  ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                  : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/60 dark:text-s-dm-text/60"
              }`}
            >
              <zone.icon size={16} />
              <span className="text-xs font-heading font-semibold">
                {t(zone.labelKey as any)}
              </span>
              {isSelected && <Check size={12} className="ml-auto" />}
            </button>
          );
        })}
      </div>

      {/* Wax type per selected zone */}
      {selected.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
            {t("wax_type_label")}
          </p>
          {selected.map((zoneKey) => (
            <div
              key={zoneKey}
              className="flex items-center justify-between rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-2 bg-white dark:bg-s-dm-surface"
            >
              <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">
                {t(`zones.${zoneKey}` as any)}
              </span>
              <select
                value={waxPrefs[zoneKey] ?? ""}
                onChange={(e) =>
                  setWaxType(zoneKey, e.target.value as WaxType)
                }
                aria-label={t("wax_type_select", {
                  zone: t(`zones.${zoneKey}` as any),
                })}
                className="text-xs px-2 py-1 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-transparent text-s-ink dark:text-s-dm-text"
              >
                <option value="">{t("wax_type_none")}</option>
                {WAX_TYPES.map((wt) => (
                  <option key={wt} value={wt}>
                    {t(`wax_types.${wt}` as any)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Selected count + save */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
          {t("zones_selected_count", { count: selected.length })}
        </span>
        <button
          onClick={save}
          disabled={saving}
          aria-label={t("save")}
          className="px-4 py-1.5 rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] shadow-coral-glow transition-[transform,filter] duration-150 disabled:opacity-50"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
