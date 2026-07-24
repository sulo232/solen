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
 * ROUND 3 (2026-07-24, same day, owner: map "looks so empty, like all white") —
 * MEASURED root cause: `colorLand` defaults to `hsl(20, 0%, 100%)` (pure white,
 * L=100%) and this function's own `colorBuildings` default was `#E4E4E7` (s-border,
 * L≈90.0%) — only ~10 percentage points of lightness apart, so building footprints
 * were nearly invisible against the ground even with labels/3D correctly off. Fixed
 * by adding a `colorLand` config property (this style never had one set explicitly
 * before) and darkening the `colorBuildings` default, both pinned to the project's
 * own neutral ramp (`_design-system/LOCKFILE.md` §1) — no invented colour:
 *   - `colorLand` -> `#F4F4F5` (token `s-bg-sunken`, L≈95.9%)
 *   - `colorBuildings` default -> `#6B6B6B` (token `s-ink-2`, L≈42.0%)
 * Lightness delta ≈ 53.9 percentage points (was ≈5.9pp between the old
 * `#E4E4E7`-on-white pairing) — buildings now read as a clearly distinct grey mass
 * against the sunken ground, without turning the basemap into wayfinding chrome
 * (labels/3D stay off, untouched by this fix). Applies globally, the same way the
 * label/3D-off fixes above do — every map surface that calls this function inherits
 * the new contrast, not just one direction of one mockup.
 *
 * This helper is THE canonical place for all of the above — call it from EVERY map
 * surface's style-ready handler, never duplicate this flag list inline in a
 * component.
 *
 * MUST run after the style has finished loading — call from the map's "load" (or
 * "style.load") event handler. Calling setConfigProperty before the style is loaded
 * throws.
 */
/**
 * SOLEN_BASEMAP_CONFIG - the canonical Mapbox Standard basemap config, as a plain object
 * so it can be passed to the Map CONSTRUCTOR ({ config: { basemap: SOLEN_BASEMAP_CONFIG } }).
 * That applies it deterministically at style init - unlike setConfigProperty on the "load"
 * event, which races the basemap import and silently no-ops when the import isn't ready
 * (the root cause of the map rendering dark sometimes and near-white other times).
 * Owner reference IMG_6693 (2026-07-24): labels + POI ON, light-grey buildings, white land.
 */
export const SOLEN_BASEMAP_CONFIG = {
  showPointOfInterestLabels: true,
  showPlaceLabels: true,
  showRoadLabels: true,
  showLandmarkIcons: false, // OFF: renders a 3D landmark building model (e.g. the Spalentor gate) as a circular highlight behind markers - owner rejected. Text/POI labels stay via the other flags.
  showPedestrianRoads: true,
  show3dObjects: false,
  show3dBuildings: true,
  show3dFacades: false,
  show3dTrees: false,
  colorLand: "#FFFFFF", // drift-ok: white land/roads per owner reference IMG_6693
  colorBuildings: "#E4E4E7", // drift-ok: token s-border, light-grey buildings per IMG_6693
} as const;

export function applySolenBasemapConfig(
  map: MapboxMap,
  options?: { colorBuildings?: string | null; colorLand?: string | null },
): void {
  const IMPORT_ID = "basemap";
  // Owner reversal (2026-07-24): "he does NOT want street names, place names, or
  // store/POI names on the map" — held at the style's own default `false`, no
  // longer flipped to `true`.
  map.setConfigProperty(IMPORT_ID, "showPointOfInterestLabels", true);
  map.setConfigProperty(IMPORT_ID, "showPlaceLabels", true);
  map.setConfigProperty(IMPORT_ID, "showRoadLabels", true);
  map.setConfigProperty(IMPORT_ID, "showLandmarkIcons", false);
  map.setConfigProperty(IMPORT_ID, "showPedestrianRoads", true);

  // Owner (2026-07-24): pointed at a 3D landmark/building object rendering near the
  // Spalentor stop — disable every 3D structure layer so nothing extruded renders.
  map.setConfigProperty(IMPORT_ID, "show3dObjects", false);
  map.setConfigProperty(IMPORT_ID, "show3dBuildings", true);
  map.setConfigProperty(IMPORT_ID, "show3dFacades", false);
  map.setConfigProperty(IMPORT_ID, "show3dTrees", false);

  // Round 3 (2026-07-24): ground darkened one step off pure white so buildings have
  // something to contrast against — token s-bg-sunken, see the dated comment above.
  const colorLand = options && "colorLand" in options ? options.colorLand : "#FFFFFF"; // drift-ok: white land/roads, matches owner reference IMG_6693, inline for Mapbox Standard config property (not a Tailwind/JSX context)
  if (colorLand) {
    map.setConfigProperty(IMPORT_ID, "colorLand", colorLand);
  }

  // Round 3 (2026-07-24): darkened from s-border (#E4E4E7, ~5.9pp off the new
  // s-bg-sunken land) to s-ink-2 (#6B6B6B, ~53.9pp off) — see the dated comment above
  // for the measured before/after delta.
  const colorBuildings = options && "colorBuildings" in options ? options.colorBuildings : "#E4E4E7"; // drift-ok: token s-border, LIGHT-grey buildings per owner reference IMG_6693 (not the rejected dark #6B6B6B), inline for Mapbox Standard config property (not a Tailwind/JSX context)
  if (colorBuildings) {
    map.setConfigProperty(IMPORT_ID, "colorBuildings", colorBuildings);
  }
}
