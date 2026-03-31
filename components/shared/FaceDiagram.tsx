"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import InteractiveZoneDiagram from "@/components/shared/InteractiveZoneDiagram";
import type { ZoneDefinition } from "@/lib/diagrams/interactive-zone";

const FACE_ZONES: ZoneDefinition[] = [
  { id: "forehead", labelKey: "face.forehead", pathId: "zone-forehead" },
  { id: "temples", labelKey: "face.temples", pathId: "zone-temples" },
  { id: "eyelids", labelKey: "face.eyelids", pathId: "zone-eyelids" },
  { id: "under_eye", labelKey: "face.under_eye", pathId: "zone-under-eye" },
  { id: "nose_bridge", labelKey: "face.nose_bridge", pathId: "zone-nose-bridge" },
  { id: "cheekbones", labelKey: "face.cheekbones", pathId: "zone-cheekbones" },
  { id: "jawline", labelKey: "face.jawline", pathId: "zone-jawline" },
  { id: "lips", labelKey: "face.lips", pathId: "zone-lips" },
  { id: "chin", labelKey: "face.chin", pathId: "zone-chin" },
];

const TECHNIQUE_COLORS: Record<string, string> = {
  highlight: "#FFD700",
  contour: "#8B4513",
  blush: "#FF69B4",
  bronzer: "#CD853F",
  shimmer: "#C0C0C0",
};

interface FaceDiagramProps {
  /** Map of zoneId → technique name */
  zoneSelections: Record<string, string>;
  onZoneClick: (zoneId: string) => void;
}

/**
 * FaceDiagram — SVG face zone selector for makeup charts.
 * Zone 4: NO glass, NO animation beyond transition-opacity duration-150.
 */
export default function FaceDiagram({ zoneSelections, onZoneClick }: FaceDiagramProps) {
  const t = useTranslations("diagrams") as any;
  const [svgSource, setSvgSource] = useState<string | null>(null);

  useEffect(() => {
    fetch("/diagrams/face-zones.svg")
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        if (text) {
          const inner = text.replace(/<\/?svg[^>]*>/gi, "").replace(/<\?xml[^>]*>/gi, "");
          setSvgSource(inner);
        }
      })
      .catch((err) => console.error("[FaceDiagram] failed to load face zones SVG:", err));
  }, []);

  const selectedZones = Object.keys(zoneSelections);

  // Build per-zone colour map based on technique
  const zoneColorMap: Record<string, string> = {};
  for (const [zoneId, technique] of Object.entries(zoneSelections)) {
    zoneColorMap[zoneId] = TECHNIQUE_COLORS[technique] ?? "var(--coral, #E8624A)";
  }

  const zoneLabelMap: Record<string, string> = {};
  for (const zone of FACE_ZONES) {
    zoneLabelMap[zone.id] = t(`face_${zone.id}` as any);
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
      zones={FACE_ZONES}
      selectedZones={selectedZones}
      onZoneSelect={(zoneId) => onZoneClick(zoneId)}
      fillColor="var(--coral, #E8624A)"
      fillOpacity={0.3}
      zoneColorMap={zoneColorMap}
      zoneLabelMap={zoneLabelMap}
      ariaLabel={t("face_diagram_label")}
      viewBox="0 0 200 250"
    />
  );
}
