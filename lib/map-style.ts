/**
 * lib/map-style.ts
 *
 * THE canonical Mapbox style for EVERY map surface in Solen. One style, no
 * exceptions — locked in `_design-system/LOCKFILE.md` §0.13.
 *
 * Source of truth: the Solen Studio style on the solen32 Mapbox account
 * (`cmpshru31000801s751e55735`), built by the owner directly in Mapbox
 * Studio (2026-05-30) — this is the style the search map
 * (components-legacy/MapView.tsx) has shipped since. Env-overridable via
 * `NEXT_PUBLIC_MAPBOX_STYLE_LIGHT` (e.g. for a staging theme experiment);
 * falls back to the solen32 style id when unset.
 *
 * No component may define its own inline `mapboxgl.StyleSpecification`, hardcode a
 * `mapbox://styles/...` literal, or fall back to a stock `mapbox/streets-v12` style.
 * Import `SOLEN_MAP_STYLE` (or `toStaticStylePath()`) from here instead.
 *
 * Measured (2026-07-23): this style renders BLANK via the Mapbox Static Images API at
 * every zoom 12-16 (~4KB response, no tiles). It only renders correctly through
 * mapbox-gl. Every map surface must use live mapbox-gl with this style, never the
 * Static Images API.
 */

import type { Map as MapboxMap } from "mapbox-gl";

export const SOLEN_MAP_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT || "mapbox://styles/solen32/cmpshru31000801s751e55735";

/**
 * Converts a `mapbox://styles/<owner>/<id>` URL (or an already-bare
 * `<owner>/<id>` / bare `<id>` string) into the `<owner>/<id>` path form the
 * Mapbox Static Images API expects. Defaults to `SOLEN_MAP_STYLE`.
 *
 * The measured blank-image caveat above still applies to THIS style — this helper
 * exists for any surface that legitimately needs the path form (e.g. building a
 * Static Images URL for a different, non-blank style), not as an invitation to pair
 * the Solen Studio style with the Static Images API.
 */
export function toStaticStylePath(style: string = SOLEN_MAP_STYLE): string {
  const bare = style.replace("mapbox://styles/", "");
  return bare.includes("/") ? bare : `mapbox/${bare}`;
}

/**
 * applySolenBasemapConfig — THE single place that controls the Mapbox Standard
 * "basemap" fragment-import config properties for EVERY map surface in Solen
 * (SalonLocation.tsx, NearbyMap.tsx, components-legacy/MapView.tsx — one function,
 * no per-surface exceptions).
 *
 * MEASURED (2026-07-23, Mapbox Styles API) — this style's single import has id
 * "basemap" and ships with:
 *   showPointOfInterestLabels: false, showPlaceLabels: false, showRoadLabels: false,
 *   showLandmarkIcons: false, showPedestrianRoads: false, showTransitLabels: true,
 *   colorBuildings: "hsl(49, 56%, 90%)" (beige), colorGreenspace: "hsl(124, 81%, 85%)",
 *   colorLand: "hsl(20, 0%, 100%)"
 *
 * REVERSED 2026-07-24 (owner: "he does NOT want street names, place names, or
 * store/POI names on the map") — this function now explicitly holds the first 5 at
 * `false` (the style's own default) instead of flipping them to `true`. Written
 * explicitly rather than just deleting the calls, so a future style edit that
 * changes the defaults cannot silently turn labels back on.
 *
 * Also disables every 3D structure layer (owner, same session: pointed at a 3D
 * landmark/building object rendering near the Spalentor stop) — `show3dObjects`,
 * `show3dBuildings`, `show3dFacades`, `show3dTrees`, all set `false` — so no 3D icon
 * or extruded structure renders on any map surface.
 *
 * This helper is THE canonical place for all of the above — call it from EVERY map
 * surface's style-ready handler, never duplicate this flag list inline in a
 * component.
 *
 * MUST run after the style has finished loading — call from the map's "load" (or
 * "style.load") event handler. Calling setConfigProperty before the style is loaded
 * throws.
 */
export function applySolenBasemapConfig(
  map: MapboxMap,
  options?: { colorBuildings?: string | null },
): void {
  const IMPORT_ID = "basemap";
  // Owner reversal (2026-07-24): "he does NOT want street names, place names, or
  // store/POI names on the map" — held at the style's own default `false`, no
  // longer flipped to `true`.
  map.setConfigProperty(IMPORT_ID, "showPointOfInterestLabels", false);
  map.setConfigProperty(IMPORT_ID, "showPlaceLabels", false);
  map.setConfigProperty(IMPORT_ID, "showRoadLabels", false);
  map.setConfigProperty(IMPORT_ID, "showLandmarkIcons", false);
  map.setConfigProperty(IMPORT_ID, "showPedestrianRoads", false);

  // Owner (2026-07-24): pointed at a 3D landmark/building object rendering near the
  // Spalentor stop — disable every 3D structure layer so nothing extruded renders.
  map.setConfigProperty(IMPORT_ID, "show3dObjects", false);
  map.setConfigProperty(IMPORT_ID, "show3dBuildings", false);
  map.setConfigProperty(IMPORT_ID, "show3dFacades", false);
  map.setConfigProperty(IMPORT_ID, "show3dTrees", false);

  const colorBuildings = options && "colorBuildings" in options ? options.colorBuildings : "#E4E4E7"; // drift-ok: token s-border, inline for Mapbox Standard config property (not a Tailwind/JSX context)
  if (colorBuildings) {
    map.setConfigProperty(IMPORT_ID, "colorBuildings", colorBuildings);
  }
}
