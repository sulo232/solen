"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import InteractiveZoneDiagram from "@/components/shared/InteractiveZoneDiagram";
import type { ZoneDefinition } from "@/lib/diagrams/interactive-zone";

const HEAD_ZONES: ZoneDefinition[] = [
  { id: "top", labelKey: "head.top", pathId: "zone-top" },
  { id: "left_side", labelKey: "head.left_side", pathId: "zone-left-side" },
  { id: "right_side", labelKey: "head.right_side", pathId: "zone-right-side" },
  { id: "back", labelKey: "head.back", pathId: "zone-back" },
  { id: "neckline", labelKey: "head.neckline", pathId: "zone-neckline" },
  { id: "temples", labelKey: "head.temples", pathId: "zone-temples" },
];

const GUARD_OPTIONS = [
  { value: "skin", label: "Skin (0)", opacity: 0.9 },
  { value: "0.5", label: "0.5", opacity: 0.75 },
  { value: "1", label: "1", opacity: 0.6 },
  { value: "1.5", label: "1.5", opacity: 0.45 },
  { value: "2", label: "2", opacity: 0.3 },
  { value: "3", label: "3", opacity: 0.2 },
  { value: "4", label: "4", opacity: 0.12 },
  { value: "scissors", label: "Scissors", opacity: 0.06 },
  { value: "finger", label: "Finger", opacity: 0.04 },
];

interface HeadDiagramProps {
  /** Map of zoneId → guard value */
  zoneGuards: Record<string, string>;
  onZoneGuardChange: (zoneId: string, guard: string) => void;
}

/**
 * HeadDiagram — SVG head zone selector for fade blueprints.
 * Zone 4: NO glass, NO animation beyond transition-opacity duration-150.
 */
export default function HeadDiagram({ zoneGuards, onZoneGuardChange }: HeadDiagramProps) {
  const t = useTranslations("dashboardBarber") as any;
  const [svgSource, setSvgSource] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/diagrams/head-zones.svg");
        if (!r.ok || cancelled) return;
        const text = await r.text();
        if (cancelled) return;
        // Strip the outer <svg> wrapper — InteractiveZoneDiagram wraps it
        const inner = text.replace(/<\/?svg[^>]*>/gi, "").replace(/<\?xml[^>]*>/gi, "");
        setSvgSource(inner);
      } catch {
        // silent fail is ok for diagram
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Build opacity map from guard selections (darker = shorter guard)
  const zoneOpacityMap: Record<string, number> = {};
  for (const [zoneId, guard] of Object.entries(zoneGuards)) {
    const opt = GUARD_OPTIONS.find((g) => g.value === guard);
    if (opt) zoneOpacityMap[zoneId] = opt.opacity;
  }

  const selectedZones = Object.keys(zoneGuards).filter((z) => zoneGuards[z]);

  const zoneLabelMap: Record<string, string> = {};
  for (const zone of HEAD_ZONES) {
    zoneLabelMap[zone.id] = t(`zone_label_${zone.id}` as any);
  }

  const handleZoneSelect = (zoneId: string) => {
    setActiveZone(activeZone === zoneId ? null : zoneId);
  };

  if (!svgSource) {
    return (
      <div className="rounded-[12px] border border-dashed border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-6 text-center">
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30">{t("diagrams_coming_soon")}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <InteractiveZoneDiagram
        svgSource={svgSource}
        zones={HEAD_ZONES}
        selectedZones={selectedZones}
        onZoneSelect={(zoneId) => handleZoneSelect(zoneId)}
        fillColor="var(--coral, #E8624A)"
        fillOpacity={0.3}
        zoneOpacityMap={zoneOpacityMap}
        zoneLabelMap={zoneLabelMap}
        ariaLabel={t("head_diagram_label")}
        viewBox="0 0 200 200"
      />

      {/* Guard size dropdown for active zone */}
      {activeZone && (
        <div className="absolute top-2 right-2 z-10 rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface p-2 shadow-[0_4px_12px_rgba(26,18,9,0.08)]">
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40 dark:text-s-dm-text/40 mb-1">
            {t("guard_size")}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {GUARD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onZoneGuardChange(activeZone, opt.value);
                  setActiveZone(null);
                }}
                className={`px-2 py-1 text-[10px] rounded-[8px] transition-colors duration-150 ${
                  zoneGuards[activeZone] === opt.value
                    ? "bg-s-coral text-white"
                    : "bg-s-ink/[0.05] text-s-ink/55 dark:bg-s-dm-text/[0.05] dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-s-dm-text/[0.09]"
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
  );
}
