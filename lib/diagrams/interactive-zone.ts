/**
 * Shared Interactive Zone Diagram — type definitions and utilities.
 * Used by HeadDiagram, BodyDiagram, FaceDiagram, HandDiagram.
 *
 * Zone 4: NO glass, NO animation beyond transition-opacity duration-150.
 */

export interface ZoneDefinition {
  /** Unique zone identifier */
  id: string;
  /** i18n label key (resolved by the consumer) */
  labelKey: string;
  /** Must match the `id` attribute on the SVG `<path>` or `<g>` element */
  pathId: string;
  /** Optional per-zone default fill colour (CSS value) */
  defaultColor?: string;
}

export interface InteractiveZoneDiagramProps {
  /** Raw SVG markup string — MUST be a trusted static asset. */
  svgSource: string;
  /** Zone definitions mapping SVG path IDs to selectable zones */
  zones: ZoneDefinition[];
  /** Currently selected zone IDs */
  selectedZones: string[];
  /** Callback when a zone is toggled */
  onZoneSelect: (zoneId: string, selected: boolean) => void;
  /** Fill colour for selected zones (CSS colour value). Default: coral */
  fillColor?: string;
  /** Fill opacity for selected zones (0–1). Default: 0.3 */
  fillOpacity?: number;
  /** Additional className for the container */
  className?: string;
  /** Accessible label for the SVG diagram */
  ariaLabel?: string;
  /** SVG viewBox override. Default: "0 0 200 200" */
  viewBox?: string;
  /** Per-zone opacity map (overrides fillOpacity for individual zones) */
  zoneOpacityMap?: Record<string, number>;
  /** Per-zone colour map (overrides fillColor for individual zones) */
  zoneColorMap?: Record<string, string>;
  /** Resolved label map (zoneId → translated label string) for tooltips */
  zoneLabelMap?: Record<string, string>;
}

/**
 * Build an inline `<style>` block that targets zone paths by ID.
 *
 * Selected zones get a fill; unselected zones get a subtle hover fill.
 * Zone 4 constraint: only transition-opacity duration-150.
 */
export function buildZoneStyles(
  zones: ZoneDefinition[],
  selectedZones: string[],
  fillColor: string,
  fillOpacity: number,
  zoneOpacityMap?: Record<string, number>,
  zoneColorMap?: Record<string, string>,
): string {
  const lines: string[] = [
    /* Zone 4: only opacity transition */
    `.izd-zone { cursor: pointer; transition: opacity 150ms; }`,
    `.izd-zone:hover { opacity: 0.85; }`,
    `.izd-zone:focus-visible { outline: 2px solid var(--coral, #E8735A); outline-offset: 1px; }`,
  ];

  for (const zone of zones) {
    const isSelected = selectedZones.includes(zone.id);
    const color = zoneColorMap?.[zone.id] ?? zone.defaultColor ?? fillColor;
    const opacity = zoneOpacityMap?.[zone.id] ?? fillOpacity;

    if (isSelected) {
      lines.push(`#${zone.pathId} { fill: ${color}; opacity: ${opacity}; }`);
    } else {
      lines.push(`#${zone.pathId} { fill: rgba(26,18,9,0.04); opacity: 1; }`);
    }
  }

  return lines.join("\n");
}
