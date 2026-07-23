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
