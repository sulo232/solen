"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import HeadDiagram from "@/components/dashboard/barber/HeadDiagram";

interface FadeBlueprintProps {
  salonId: string;
  clientId?: string;
}

const GUARD_OPTIONS = [
  { value: "skin", label: "Skin (0)", opacity: 0.9 },
  { value: "0.5", label: "0.5", opacity: 0.75 },
  { value: "1", label: "1", opacity: 0.6 },
  { value: "1.5", label: "1.5", opacity: 0.45 },
  { value: "2", label: "2", opacity: 0.3 },
  { value: "3", label: "3", opacity: 0.2 },
  { value: "4", label: "4", opacity: 0.12 },
  { value: "scissors", label: "Scissors", opacity: 0.06 },
  { value: "finger", label: "Finger length", opacity: 0.04 },
];

const FADE_TYPES = ["skin", "low", "mid", "high", "taper", "drop", "temp", "burst", "none"] as const;
const BEARD_STYLES = ["full_shape", "trim", "sculpt", "shave", "goatee", "stubble", "none"] as const;

interface HeadZone {
  id: "top" | "sides" | "back" | "neckline";
  d: string;
  labelX: number;
  labelY: number;
}

const HEAD_ZONES: HeadZone[] = [
  { id: "top", d: "M60,30 Q100,10 140,30 Q145,50 140,70 Q100,80 60,70 Q55,50 60,30Z", labelX: 100, labelY: 50 },
  { id: "sides", d: "M40,70 Q55,50 60,30 Q35,45 30,70 Q35,100 50,115 Q55,95 40,70Z M160,70 Q145,50 140,30 Q165,45 170,70 Q165,100 150,115 Q145,95 160,70Z", labelX: 35, labelY: 70 },
  { id: "back", d: "M50,115 Q75,130 100,135 Q125,130 150,115 Q145,95 140,70 Q100,80 60,70 Q55,95 50,115Z", labelX: 100, labelY: 105 },
  { id: "neckline", d: "M55,135 Q78,150 100,155 Q122,150 145,135 Q125,130 100,135 Q75,130 55,135Z", labelX: 100, labelY: 145 },
];

const NECKLINE_STYLES = ["rounded", "squared", "tapered", "blocked", "freehand"] as const;

interface BlueprintState {
  top_guard: string;
  sides_guard: string;
  back_guard: string;
  neckline_style: string;
  fade_type: string;
  lineup: boolean;
  beard_style: string;
  notes: string;
}

const EMPTY_STATE: BlueprintState = {
  top_guard: "",
  sides_guard: "",
  back_guard: "",
  neckline_style: "",
  fade_type: "none",
  lineup: false,
  beard_style: "none",
  notes: "",
};

export default function FadeBlueprint({ salonId, clientId }: FadeBlueprintProps) {
  const t = useTranslations("dashboardBarber") as any;
  const [blueprint, setBlueprint] = useState<BlueprintState>(EMPTY_STATE);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [visualMode, setVisualMode] = useState(false);

  // Load last blueprint for returning client
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetch(
        `/api/dashboard/fade-blueprints?salon_id=${salonId}&client_id=${clientId}`
      );
      if (res.ok && !cancelled) {
        const data = await res.json();
        if (!cancelled && data.data) {
          setBlueprint({
            top_guard: data.data.top_guard ?? "",
            sides_guard: data.data.sides_guard ?? "",
            back_guard: data.data.back_guard ?? "",
            neckline_style: data.data.neckline_style ?? "",
            fade_type: data.data.fade_type ?? "none",
            lineup: data.data.lineup ?? false,
            beard_style: data.data.beard_style ?? "none",
            notes: data.data.notes ?? "",
          });
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [salonId, clientId]);

  const getGuardOpacity = (guardValue: string): number => {
    return GUARD_OPTIONS.find((g) => g.value === guardValue)?.opacity ?? 0;
  };

  const getZoneGuard = (zoneId: string): string => {
    if (zoneId === "top") return blueprint.top_guard;
    if (zoneId === "sides") return blueprint.sides_guard;
    if (zoneId === "back") return blueprint.back_guard;
    return "";
  };

  const setZoneGuard = (zoneId: string, value: string) => {
    setBlueprint((prev) => ({
      ...prev,
      [`${zoneId}_guard`]: value,
    }));
    setActiveZone(null);
  };

  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    const res = await fetch("/api/dashboard/fade-blueprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salon_id: salonId,
        client_id: clientId,
        ...blueprint,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="rounded-input border border-s-ink/[0.06] bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("fade_blueprint")}
        </p>
        <div className="flex items-center gap-2">
          <button
            aria-pressed={visualMode}
            onClick={() => setVisualMode(!visualMode)}
            className={`rounded-[8px] border px-3 py-1.5 text-[10px] font-heading font-semibold transition-colors duration-150 ${
              visualMode
                ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                : "border-s-ink/[0.06] text-s-ink/40"
            }`}
            aria-label={t(visualMode ? "text_mode" : "visual_mode")}
          >
            {t(visualMode ? "text_mode" : "visual_mode")}
          </button>
          {clientId && (
            <button
              onClick={() => setBlueprint(EMPTY_STATE)}
              className="p-1.5 rounded-[8px] bg-s-ink/5 text-s-ink/40 hover:bg-s-ink/10 transition-colors duration-150"
              aria-label={t("reset")}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Visual Mode: HeadDiagram SVG / Text Mode: inline SVG */}
      {visualMode ? (
        <HeadDiagram
          zoneGuards={{
            top: blueprint.top_guard,
            left_side: blueprint.sides_guard,
            right_side: blueprint.sides_guard,
            back: blueprint.back_guard,
            neckline: "",
            temples: "",
          }}
          onZoneGuardChange={(zoneId, guard) => {
            if (zoneId === "left_side" || zoneId === "right_side") {
              setBlueprint((prev) => ({ ...prev, sides_guard: guard }));
            } else if (zoneId === "top" || zoneId === "back") {
              setBlueprint((prev) => ({ ...prev, [`${zoneId}_guard`]: guard }));
            }
          }}
        />
      ) : (
        <div className="max-w-[260px] sm:max-w-[300px] aspect-square mx-auto rounded-input border border-s-ink/[0.06] overflow-hidden bg-[--base] relative">
          <svg viewBox="0 0 200 170" className="w-full h-full">
            {HEAD_ZONES.map((zone) => {
              const guard = getZoneGuard(zone.id);
              const opacity = guard ? getGuardOpacity(guard) : 0;
              return (
                <g key={zone.id}>
                  <path
                    d={zone.d}
                    fill={
                      guard
                        ? `rgba(232, 98, 74, ${opacity})`
                        : "rgba(26, 18, 9, 0.04)"
                    }
                    stroke="rgba(26, 18, 9, 0.15)"
                    strokeWidth="1"
                    className="cursor-pointer transition-opacity duration-150"
                    onClick={() =>
                      setActiveZone(activeZone === zone.id ? null : zone.id)
                    }
                  />
                  <text
                    x={zone.labelX}
                    y={zone.labelY}
                    textAnchor="middle"
                    className="text-[8px] fill-s-ink/50 pointer-events-none select-none"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  >
                    {guard
                      ? GUARD_OPTIONS.find((g) => g.value === guard)?.label ?? guard
                      : t(`zone_${zone.id}`)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Guard dropdown */}
          {activeZone && activeZone !== "neckline" && (
            <div className="absolute top-2 right-2 z-10 rounded-input border border-s-ink/[0.06] bg-white p-2 shadow-elevation-2">
              <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40 mb-1">
                {t("guard_size")}
              </p>
              <div className="grid grid-cols-3 gap-1">
                {GUARD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setZoneGuard(activeZone, opt.value)}
                    className={`px-2 py-1 text-[10px] rounded-[8px] transition-colors duration-150 ${
                      getZoneGuard(activeZone) === opt.value
                        ? "bg-s-coral text-white"
                        : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
                    }`}
                    aria-label={opt.label}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 space-y-3">
        {/* Neckline Style */}
        <div>
          <p className="text-[10px] font-heading font-bold text-s-ink/50 uppercase tracking-[.12em] mb-1">
            {t("neckline")}
          </p>
          <div className="flex flex-wrap gap-1">
            {NECKLINE_STYLES.map((style) => (
              <button
                key={style}
                onClick={() =>
                  setBlueprint((prev) => ({ ...prev, neckline_style: style }))
                }
                className={`px-3 py-1 text-[10px] rounded-[8px] transition-colors duration-150 ${
                  blueprint.neckline_style === style
                    ? "bg-s-coral text-white"
                    : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
                }`}
                aria-label={style}
              >
                {t(`neckline_${style}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Fade Type */}
        <div>
          <p className="text-[10px] font-heading font-bold text-s-ink/50 uppercase tracking-[.12em] mb-1">
            {t("fade_type")}
          </p>
          <div className="flex flex-wrap gap-1">
            {FADE_TYPES.map((ft) => (
              <button
                key={ft}
                onClick={() =>
                  setBlueprint((prev) => ({ ...prev, fade_type: ft }))
                }
                className={`px-3 py-1 text-[10px] rounded-[8px] transition-colors duration-150 ${
                  blueprint.fade_type === ft
                    ? "bg-s-coral text-white"
                    : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
                }`}
                aria-label={ft}
              >
                {ft}
              </button>
            ))}
          </div>
        </div>

        {/* Lineup + Beard */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={blueprint.lineup}
              onChange={(e) =>
                setBlueprint((prev) => ({ ...prev, lineup: e.target.checked }))
              }
              className="rounded-[4px] border-s-ink/20 text-s-coral focus:ring-s-coral"
            />
            <span className="text-xs text-s-ink">
              {t("lineup")}
            </span>
          </label>

          <div className="flex-1">
            <select
              value={blueprint.beard_style}
              onChange={(e) =>
                setBlueprint((prev) => ({
                  ...prev,
                  beard_style: e.target.value,
                }))
              }
              className="w-full text-xs rounded-[8px] border border-s-ink/[0.06] bg-white text-s-ink p-2"
              aria-label={t("beard_style")}
            >
              {BEARD_STYLES.map((bs) => (
                <option key={bs} value={bs}>
                  {t(`beard_${bs}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <textarea
          value={blueprint.notes}
          onChange={(e) =>
            setBlueprint((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder={t("blueprint_notes_placeholder")}
          rows={2}
          className="w-full text-xs rounded-[8px] border border-s-ink/[0.06] bg-white text-s-ink p-2 resize-none"
          aria-label={t("notes")}
        />

        {/* Save */}
        {clientId && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-[8px] bg-s-coral text-white text-sm font-heading font-semibold hover:brightness-[1.06] active:scale-[0.97] shadow-coral-glow transition-[transform,filter] duration-150 disabled:opacity-50"
            aria-label={t("save_blueprint")}
          >
            <Save size={14} />
            {saved ? t("saved") : saving ? t("saving") : t("save_blueprint")}
          </button>
        )}
      </div>
    </div>
  );
}
