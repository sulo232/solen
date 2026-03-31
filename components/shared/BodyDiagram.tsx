"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import InteractiveZoneDiagram from "@/components/shared/InteractiveZoneDiagram";
import type { ZoneDefinition } from "@/lib/diagrams/interactive-zone";

const BODY_ZONES: ZoneDefinition[] = [
  { id: "neck", labelKey: "body.neck", pathId: "zone-neck" },
  { id: "shoulders", labelKey: "body.shoulders", pathId: "zone-shoulders" },
  { id: "chest", labelKey: "body.chest", pathId: "zone-chest" },
  { id: "upper_back", labelKey: "body.upper_back", pathId: "zone-upper-back" },
  { id: "stomach", labelKey: "body.stomach", pathId: "zone-stomach" },
  { id: "lower_back", labelKey: "body.lower_back", pathId: "zone-lower-back" },
  { id: "full_arms", labelKey: "body.full_arms", pathId: "zone-full-arms" },
  { id: "full_legs", labelKey: "body.full_legs", pathId: "zone-full-legs" },
  { id: "feet", labelKey: "body.feet", pathId: "zone-feet" },
];

interface BodyDiagramProps {
  selectedZones: string[];
  onZoneSelect: (zoneId: string, selected: boolean) => void;
  /** "spa" uses red for tension/pain areas, "waxing" uses coral for zone selection */
  mode?: "spa" | "waxing";
  /** Per-zone severity (spa mode): zoneId → 0-1 opacity */
  severityMap?: Record<string, number>;
}

/**
 * BodyDiagram — SVG body zone selector shared between spa + waxing.
 * Zone 4: NO glass, NO animation beyond transition-opacity duration-150.
 */
export default function BodyDiagram({
  selectedZones,
  onZoneSelect,
  mode = "waxing",
  severityMap,
}: BodyDiagramProps) {
  const t = useTranslations("diagrams") as any;
  const [svgSource, setSvgSource] = useState<string | null>(null);

  useEffect(() => {
    fetch("/diagrams/body-zones.svg")
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        if (text) {
          const inner = text.replace(/<\/?svg[^>]*>/gi, "").replace(/<\?xml[^>]*>/gi, "");
          setSvgSource(inner);
        }
      })
      .catch((err) => console.error("[BodyDiagram] failed to load body zones SVG:", err));
  }, []);

  const fillColor = mode === "spa" ? "#DC2626" : "var(--coral, #E8624A)";
  const fillOpacity = mode === "spa" ? 0.4 : 0.3;

  const zoneLabelMap: Record<string, string> = {};
  for (const zone of BODY_ZONES) {
    zoneLabelMap[zone.id] = t(`body_${zone.id}` as any);
  }

  if (!svgSource) {
    return (
      <div className="rounded-[12px] border border-dashed border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-6 text-center">
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30">{t("coming_soon")}</p>
      </div>
    );
  }

  return (
    <InteractiveZoneDiagram
      svgSource={svgSource}
      zones={BODY_ZONES}
      selectedZones={selectedZones}
      onZoneSelect={onZoneSelect}
      fillColor={fillColor}
      fillOpacity={fillOpacity}
      zoneOpacityMap={severityMap}
      zoneLabelMap={zoneLabelMap}
      ariaLabel={t("body_diagram_label")}
      viewBox="0 0 200 300"
    />
  );
}
