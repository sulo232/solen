"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import InteractiveZoneDiagram from "@/components/shared/InteractiveZoneDiagram";
import type { ZoneDefinition } from "@/lib/diagrams/interactive-zone";

const HAND_ZONES: ZoneDefinition[] = [
  { id: "thumb_nail", labelKey: "hand.thumb", pathId: "zone-thumb-nail" },
  { id: "index_nail", labelKey: "hand.index", pathId: "zone-index-nail" },
  { id: "middle_nail", labelKey: "hand.middle", pathId: "zone-middle-nail" },
  { id: "ring_nail", labelKey: "hand.ring", pathId: "zone-ring-nail" },
  { id: "pinky_nail", labelKey: "hand.pinky", pathId: "zone-pinky-nail" },
];

interface HandDiagramProps {
  /** Selected nail zone IDs (e.g. accent nails) */
  selectedNails: string[];
  onNailSelect: (nailId: string, selected: boolean) => void;
}

/**
 * HandDiagram — SVG hand/nail zone selector for nail design specs.
 * Zone 4: NO glass, NO animation beyond transition-opacity duration-150.
 */
export default function HandDiagram({ selectedNails, onNailSelect }: HandDiagramProps) {
  const t = useTranslations("diagrams") as any;
  const [svgSource, setSvgSource] = useState<string | null>(null);

  useEffect(() => {
    fetch("/diagrams/hand-zones.svg")
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        if (text) {
          const inner = text.replace(/<\/?svg[^>]*>/gi, "").replace(/<\?xml[^>]*>/gi, "");
          setSvgSource(inner);
        }
      })
      .catch(() => {});
  }, []);

  const zoneLabelMap: Record<string, string> = {};
  for (const zone of HAND_ZONES) {
    zoneLabelMap[zone.id] = t(`hand_${zone.id}` as any);
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
      zones={HAND_ZONES}
      selectedZones={selectedNails}
      onZoneSelect={onNailSelect}
      fillColor="var(--coral, #E8624A)"
      fillOpacity={0.4}
      zoneLabelMap={zoneLabelMap}
      ariaLabel={t("hand_diagram_label")}
      viewBox="0 0 200 250"
    />
  );
}
