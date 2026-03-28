"use client";

import { useRef, useCallback } from "react";
import type { InteractiveZoneDiagramProps } from "@/lib/diagrams/interactive-zone";
import { buildZoneStyles } from "@/lib/diagrams/interactive-zone";

/**
 * InteractiveZoneDiagram — shared click-to-select SVG zone framework.
 *
 * Zone 4: NO glass, NO animation beyond transition-opacity duration-150.
 * SVG is inlined via dangerouslySetInnerHTML — ONLY use with trusted static
 * assets from public/diagrams/. Never pass user-generated SVG content.
 */
export default function InteractiveZoneDiagram({
  svgSource,
  zones,
  selectedZones,
  onZoneSelect,
  fillColor = "var(--coral, #E8624A)",
  fillOpacity = 0.3,
  className,
  ariaLabel = "Interactive zone diagram",
  viewBox = "0 0 200 200",
  zoneOpacityMap,
  zoneColorMap,
  zoneLabelMap,
}: InteractiveZoneDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as SVGElement;
      const el = target.closest("[id^='zone-']") as SVGElement | null;
      if (!el) return;

      const pathId = el.getAttribute("id");
      if (!pathId) return;

      const zone = zones.find((z) => z.pathId === pathId);
      if (!zone) return;

      const isSelected = selectedZones.includes(zone.id);
      onZoneSelect(zone.id, !isSelected);
    },
    [zones, selectedZones, onZoneSelect],
  );

  const styleBlock = buildZoneStyles(
    zones,
    selectedZones,
    fillColor,
    fillOpacity,
    zoneOpacityMap,
    zoneColorMap,
  );

  // Add izd-zone class + tabindex + role + aria-label to each zone path in SVG
  let processedSvg = svgSource;
  for (const zone of zones) {
    const label = zoneLabelMap?.[zone.id] ?? zone.id;
    const isSelected = selectedZones.includes(zone.id);
    // Match opening tag of element with this pathId and inject attributes
    const idPattern = new RegExp(
      `(id=["']${zone.pathId}["'])`,
      "g",
    );
    processedSvg = processedSvg.replace(
      idPattern,
      `$1 class="izd-zone" tabindex="0" role="button" aria-label="${label}" aria-pressed="${isSelected}"`,
    );
  }

  // XSS WARNING: svgSource MUST be a trusted static asset from public/diagrams/.
  // Never pass user-generated or untrusted SVG content to this component.
  const svgHtml = `<style>${styleBlock}</style>${processedSvg}`;

  return (
    <div
      ref={containerRef}
      className={`max-w-[260px] sm:max-w-[300px] lg:max-w-[400px] aspect-square mx-auto ${className ?? ""}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const target = e.target as SVGElement;
          const el = target.closest("[id^='zone-']") as SVGElement | null;
          if (!el) return;
          const pathId = el.getAttribute("id");
          if (!pathId) return;
          const zone = zones.find((z) => z.pathId === pathId);
          if (!zone) return;
          const isSelected = selectedZones.includes(zone.id);
          onZoneSelect(zone.id, !isSelected);
        }
      }}
    >
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={viewBox}
        className="w-full h-full"
        /* XSS WARNING: Only static assets. See comment above. */
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </div>
  );
}
