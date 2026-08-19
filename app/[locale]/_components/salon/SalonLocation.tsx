"use client";

import * as React from "react";
import { Bus, Footprints, MapPin, Navigation, TrainFront, TramFront, type LucideIcon } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Marker as MapboxMarker } from "mapbox-gl";
import type { SalonDetail } from "./_shared";
import { SOLEN_MAP_STYLE, toStaticStylePath, applySolenBasemapConfig, SOLEN_BASEMAP_CONFIG } from "@/lib/map-style";
import { useTranslations } from "next-intl";

/**
 * SalonLocation — V3-D389 (2026-05-31, Fresha 1:1 PDP capture).
 *
 * Standalone "Standort" section: map, then address + directions.
 *
 * The map is a LIVE mapbox-gl render (2026-07-23, replaces the earlier static Mapbox
 * image — measured finding: the Solen Studio style used by the search map
 * (components-legacy/MapView.tsx:139) returns a blank image from the Static Images API
 * at every zoom 12-16; it only renders under mapbox-gl). Non-interactive (no gesture
 * trap on a scrolling page).
 *
 * The map surface itself no longer opens Google Maps on tap (owner feedback,
 * 2026-07-23: "when you click it, just opens Google Maps, and that's not what I
 * want") — `map`/`compact` keep their explicit "Wegbeschreibung" text link as the
 * deliberate directions affordance beside the address; `card-overlay`'s floating
 * name/address card keeps its own tap-to-open-Maps link (that card, not the map
 * tile behind it, is this variant's equivalent affordance).
 *
 * `variant` (added 2026-07-23 for the /dev/pdp/location direction mockup):
 * treatment switch. Default is now "card-overlay" (the owner's pick out of the 3
 * mockup directions — every existing caller, e.g. SalonDetailV3, omits the prop and
 * gets this). "map" is the original pre-mockup markup, kept for reference/reversion.
 * "compact" is the third mockup direction, not currently used by any caller.
 *
 * `transitChipVariant` (added 2026-07-24 for the /dev/pdp/transit direction mockup,
 * card-overlay only, superseded 2026-07-24 same day by the owner's final pick — see
 * below): owner critique on the shipped chip — "it's not really balanced" (alignment),
 * "we don't need the city name", "we don't need the point" (the trailing period), "we
 * can't really identify what it is" (16px bare glyph). Three experimental directions
 * (stacked-badge / inline-pill / labelled, see TransitChip below) were built to answer
 * that critique; the owner then picked a 4th, simpler direction instead — no circular
 * badge on the card at all, a Footprints (walking) icon + blue minutes + stop name, and
 * the actual transit STOP moved onto the map itself as a small marker. That direction
 * is now what "current" renders (the PRODUCTION DEFAULT — every existing caller, which
 * omits this prop, gets it). The 3 experimental directions stay reachable via an
 * explicit `transitChipVariant` prop so /dev/pdp/transit still compiles and still shows
 * them for reference, but none of them ship anywhere.
 *
 * `mapDesign` (added 2026-07-24 for the /dev/pdp/mapdesign direction mockup, card-overlay
 * only): a SEPARATE in-map treatment switch from `variant`/`transitChipVariant` above —
 * this one only changes what's rendered INSIDE the map canvas (LocationMapCanvas), not
 * the floating card. Default "current" is the untouched production render — every
 * existing caller omits this prop and is unaffected.
 *
 * Round 2 (2026-07-24, same day, owner review of round 1's Lime-reference mockup):
 * the owner rejected the round-1 direction wholesale — black-filled circle marker with
 * an accent-blue ring ("must NOT be black, and the blue ring... must go"), a dark
 * on-map time pill ("he does not want it on the map at all"), and a transit marker
 * that didn't read as one glyph+label unit. "path-pill" / "store-anchor" / "minimal"
 * (the round-1 directions) are REMOVED — no caller, dev or production, references them
 * any more; the on-map time pill (`pillMarkerEl`) is deleted outright, not reachable
 * from any direction. Two round-1 findings DO carry forward as project-wide fixes
 * (not gated by this prop at all, see `applySolenBasemapConfig` in lib/map-style.ts
 * and `fit()` below): POI/place/road labels + landmark icons + pedestrian-road
 * styling are held OFF (reversing the round-1 "flip to true" — owner: "he does NOT
 * want street names, place names, or store/POI names on the map"), every 3D
 * structure layer is disabled (a 3D landmark rendered near the Spalentor stop), and
 * the salon+stop `fitBounds` frame is zoomed out further.
 *
 * Round 2's replacement is 3 new directions — "clean-white" / "ink-glyph" / "sunken"
 * — all sharing a WHITE-OR-SUNKEN (never black), ring-free circular store marker
 * (`storeMarkerEl`) and a redesigned transit marker that is ONE visual unit — glyph
 * directly above the stop name, centred, no circle/pill/background chip
 * (`transitUnitMarkerEl`) — anchored so the GLYPH itself (not the label under it)
 * sits on the stop's exact coordinate. They differ only in store-marker fill,
 * transit-marker/label colour, and whether the dotted walking route renders at all
 * (the owner questioned whether a manually-drawn route "scales up" — treated here as
 * a per-direction choice, not a given): "clean-white" (white marker, blue transit
 * unit, no route), "ink-glyph" (white marker, ink transit unit, a thin/low-opacity
 * route), "sunken" (s-bg-sunken marker, white transit unit with a legibility shadow,
 * no route). See /dev/pdp/mapdesign for all 3 rendered side by side.
 *
 * ROUND 3 (2026-07-24, same day, owner review of round 2's 3 directions): further
 * iteration, not a wholesale rejection this time — round 2's white-or-sunken circular
 * store marker and glyph-above-name transit unit are SUPERSEDED, everything else
 * (labels/3D off, the zoom-out fitBounds framing) carries forward unchanged. Four
 * owner asks, all system-wide across every non-"current" direction:
 *  - the store marker becomes a PIN, not a circle ("the owner likes the store glyph
 *    but wants a PIN shape, not a full circle") — `storePinMarkerEl` reuses
 *    `pinMarkerEl`'s own teardrop geometry with the Store glyph inset in its head,
 *    still white-or-sunken, never black.
 *  - the transit stop becomes a CIRCLE with an always-BLUE (`s-accent` #276EF1)
 *    glyph — the shapes literally swap (`transitCircleMarkerEl`, reusing round 2's
 *    circular geometry). Per-direction ink/white glyph colour (`transitUnitColorFor`)
 *    is gone — blue is now fixed everywhere non-"current" renders, so the 3
 *    directions differ on OTHER axes instead (see below).
 *  - the station name moves INTO one pill shape attached to the circle
 *    (`pillAttachmentFor`: "under" the circle vs "beside" it), replacing round 2's
 *    bare label-under-glyph text — "the bare text label is rejected... put the
 *    station name inside one pill/shape".
 *  - the dotted walking route (only Direction B below still draws one) goes from
 *    `line-opacity: 0.45` to a much bolder `0.9` — "increase the dotted route's
 *    saturation/opacity toward full s-accent".
 * Building legibility (map "looks so empty, like all white") and the zoom-to-distance
 * system are NOT per-direction toggles — both are global fixes: see
 * `applySolenBasemapConfig` (lib/map-style.ts, `colorLand`/`colorBuildings`) and
 * `maxZoomForStopDistance` below, applied identically across all 3 directions AND
 * "current" production, the same way round 2 treated the labels/3D/zoom-out fixes.
 * The 3 directions below now differ on pill attachment (under vs beside), marker fill
 * (white vs sunken), and whether the boosted-blue route line renders at all — see
 * /dev/pdp/mapdesign for all 3 rendered side by side.
 *
 * ROUND 4 (2026-07-24, same day, the owner's decision on round 3's 3 directions):
 * "clean-white" (Direction A) is promoted to the PRODUCTION default — SalonDetailV3
 * now passes `mapDesign="clean-white"` explicitly instead of omitting the prop, and
 * "current" (the original ink-teardrop/dot-pill render) is what now sits behind an
 * explicit opt-in prop for reference/reversion. The owner's exact ask: "Direction A,
 * but with dots" — so "clean-white" also gains the dotted walking route
 * (addRouteFeatures, previously gated to "ink-glyph" only), keeping its route styling
 * unchanged (real Mapbox Directions geometry, dashed, s-accent #276EF1, no on-map time
 * pill). "ink-glyph" and "sunken" are untouched, still reachable only via an explicit
 * mapDesign prop for the /dev/pdp/mapdesign comparison route.
 */
export function SalonLocation({
  salon,
  variant = "card-overlay",
  mapStyle,
  transitChipVariant = "current",
  mapDesign = "current",
}: {
  salon: SalonDetail;
  variant?: "map" | "card-overlay" | "compact";
  /** Standard Mapbox style id — works with the existing public token. Default = the
   *  same Solen Studio style the search map uses (see SOLEN_STYLE below). */
  mapStyle?: string;
  /** Transit chip treatment inside the card-overlay variant's floating info card.
   *  Default "current" is the owner's final pick (2026-07-24) and the PRODUCTION
   *  DEFAULT: no badge on the card, Footprints icon + blue minutes + stop name, stop
   *  itself rendered as a small marker on the map. "stacked-badge" / "inline-pill" /
   *  "labelled" are the 3 superseded experimental directions, kept only so
   *  /dev/pdp/transit still compiles and can show them for reference — no production
   *  caller passes them. */
  transitChipVariant?: "current" | "stacked-badge" | "inline-pill" | "labelled";
  /** In-map treatment for the card-overlay variant's map canvas — see the file header
   *  JSDoc above for the full owner-reference context (round-1 "path-pill" /
   *  "store-anchor" / "minimal" are gone, superseded by round 2; round 2's circular
   *  store marker + glyph-above-name transit unit are gone, superseded by round 3).
   *  ROUND 4 (2026-07-24, same day): the owner picked "clean-white" (Direction A) as
   *  the PRODUCTION default, plus the dotted walking route ("Direction A, but with
   *  dots") — SalonDetailV3 now passes `mapDesign="clean-white"` explicitly instead of
   *  omitting the prop. "current" (the untouched original render: ink teardrop salon
   *  pin, old dot+pill transit-stop marker, no route line) stays reachable only via an
   *  explicit prop now, kept for reference/reversion and the /dev/pdp/mapdesign
   *  comparison. "ink-glyph" / "sunken" are the remaining round-3 directions
   *  (pin-shaped store marker, blue-glyph circular transit marker, station name in one
   *  pill), still reachable only via this explicit prop for the dev comparison route.
   *  This prop ONLY affects the map canvas — the floating card's own content
   *  (name/address/walk-time chip) is identical across all 4 directions, since the ask
   *  was explicitly "in-map" design directions, not a card redesign. */
  mapDesign?: "current" | "clean-white" | "ink-glyph" | "sunken";
}) {
  const t = useTranslations("salonDetail");
  const hasCoords = Boolean(salon.latitude && salon.longitude);

  // Nearest public-transport stop — replaces the old hardcoded `walkTimeMinutes`
  // mockup prop (2026-07-23, owner: "we don't know where the person is... mark the
  // nearest bus or tram station"). Real coordinates in, real station+distance out via
  // /api/transit/nearest-stop (transport.opendata.ch). Only `card-overlay` renders
  // this, so only it fetches — declared above the early `return null` below so the
  // hook count stays constant across renders (Rules of Hooks).
  const [transitStop, setTransitStop] = React.useState<NearestTransitStop | null>(null);
  React.useEffect(() => {
    if (variant !== "card-overlay" || !hasCoords) return;
    let cancelled = false;
    fetch(`/api/transit/nearest-stop?lat=${salon.latitude}&lng=${salon.longitude}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { stop: NearestTransitStop | null } | null) => {
        if (!cancelled) setTransitStop(data?.stop ?? null);
      })
      .catch(() => {
        // Degrade gracefully: no chip, never a fabricated fallback number.
        if (!cancelled) setTransitStop(null);
      });
    return () => {
      cancelled = true;
    };
  }, [variant, hasCoords, salon.latitude, salon.longitude]);

  if (!salon.address && !hasCoords) return null;

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  // Use the SAME style the search map uses (components-legacy/MapView.tsx:139): the real
  // Solen Studio style on the solen32 account, env override winning exactly as it does there.
  // Canonical Solen map style — single source of truth (lib/map-style.ts, LOCKFILE §0.13).
  const stylePath = mapStyle
    ? mapStyle.includes("/")
      ? mapStyle.replace("mapbox://styles/", "")
      : `mapbox/${mapStyle}`
    : toStaticStylePath(SOLEN_MAP_STYLE);
  const canRenderMap = hasCoords && Boolean(token);
  const TransitIcon = transitStop ? transitIconFor(transitStop.type) : null;

  // ---- variant: card-overlay — the map stays 4:3, a white name/address/transit-stop
  // card floats over its bottom edge instead of the address row living below it.
  if (variant === "card-overlay") {
    return (
      <section id="section-location">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {t("location")}
        </h2>

        {canRenderMap && (
          <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-s-border">
            {/* 2026-07-23: no longer a tap-to-open-Maps link — owner feedback, tapping
                the map surface itself shouldn't navigate away. Plain div now; the
                floating card below stays the tappable directions affordance. */}
            <div className="absolute inset-0">
              <LocationMapCanvas
                longitude={salon.longitude}
                latitude={salon.latitude}
                stylePath={stylePath}
                label={`Karte: ${salon.address}`}
                transitStop={transitStop}
                mapDesign={mapDesign}
              />
            </div>

            {/* Floating info card — still the deliberate tap-to-open-Maps affordance for
                this variant (equivalent to the "Wegbeschreibung" link in the other two). */}
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t("openInGoogleMaps", { name: salon.name })}
              className={`absolute inset-x-3 bottom-3 z-10 flex ${
                transitChipVariant === "inline-pill" ? "items-end" : "items-center"
              } justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-elevation-3 transition-opacity hover:opacity-90`}
            >
              <span className="min-w-0">
                <span className="block truncate font-body text-[14px] font-semibold text-s-ink">{salon.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-s-ink-2">
                  <MapPin size={12} className="shrink-0 text-s-ink-2" strokeWidth={2} />
                  <span className="truncate">{salon.address}</span>
                </span>
              </span>
              {transitStop &&
                TransitIcon &&
                (transitChipVariant === "current" ? (
                  // Owner's final pick (2026-07-24): no circle badge, no tram icon on the
                  // card — those move to the map itself (the second marker LocationMapCanvas
                  // renders above). Just a walking icon + blue minutes + stop name.
                  // Owner 2026-07-24: walking icon ON TOP of the minutes, both blue and
                  // optically size-matched, icon noticeably bigger, and NO station name —
                  // the name + tram/bus glyph live on the map marker instead.
                  <span className="flex shrink-0 flex-col items-center gap-0.5 leading-none">
                    <Footprints size={20} strokeWidth={2.2} className="shrink-0 text-s-accent" />
                    <span className="text-[13px] font-semibold text-s-accent">{formatWalkMinutes(transitStop.walkMinutes)}</span>
                  </span>
                ) : (
                  <TransitChip variant={transitChipVariant} Icon={TransitIcon} stop={transitStop} />
                ))}
            </a>
          </div>
        )}
      </section>
    );
  }

  // ---- variant: compact — a shorter 2:1 map with the address row beside it
  // instead of the full-width map + address-below-it layout.
  if (variant === "compact") {
    return (
      <section id="section-location">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {t("location")}
        </h2>

        <div className="mt-5 flex items-center gap-4">
          {canRenderMap && (
            <div className="relative aspect-[2/1] w-[152px] shrink-0 overflow-hidden rounded-2xl border border-s-border">
              <LocationMapCanvas longitude={salon.longitude} latitude={salon.latitude} stylePath={stylePath} label={`Karte: ${salon.address}`} />
            </div>
          )}
          <div className="min-w-0 flex-1 font-body text-[14px]">
            <span className="flex items-start gap-1.5 text-s-ink-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-s-ink-2" strokeWidth={1.6} />
              <span className="leading-snug">{salon.address}</span>
            </span>
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer noopener"
              className="group mt-1.5 inline-flex items-center gap-1 font-medium text-s-accent transition-opacity hover:opacity-80"
            >
              <Navigation size={13} className="text-s-accent transition-transform duration-200 ease-glide group-hover:translate-x-0.5" />
              Wegbeschreibung
            </a>
          </div>
        </div>
      </section>
    );
  }

  // ---- variant: map (default) — original pre-mockup markup, minus the map-surface
  // tap-to-open-Maps link (2026-07-23, see file header).
  return (
    <section id="section-location">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("location")}
      </h2>

      {canRenderMap && (
        <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-s-border">
          <LocationMapCanvas longitude={salon.longitude} latitude={salon.latitude} stylePath={stylePath} label={`Karte: ${salon.address}`} />
        </div>
      )}

      {/* Street stays plain ink; "Wegbeschreibung" is the link BESIDE it (no blue street). */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[14px]">
        <span className="inline-flex items-center gap-1.5 text-s-ink-2">
          <MapPin size={14} className="shrink-0 text-s-ink-2" strokeWidth={1.6} />
          {salon.address}
        </span>
        <a
          href={directionsHref}
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex items-center gap-1 font-medium text-s-accent transition-opacity hover:opacity-80"
        >
          <Navigation size={13} className="text-s-accent transition-transform duration-200 ease-glide group-hover:translate-x-0.5" />
          Wegbeschreibung
        </a>
      </div>
    </section>
  );
}

// Local mirror of app/api/transit/nearest-stop/route.ts's response shape (type-only —
// no runtime import from a route module). Kept in sync by hand; the route is the
// source of truth for the actual values.
type TransitStopType = "tram" | "bus" | "train" | "other";
type NearestTransitStop = {
  name: string;
  type: TransitStopType;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  walkMinutes: number;
};

/** tram/bus/train -> the matching Lucide glyph (all 3 confirmed present in the
 *  installed lucide-react — package.json "lucide-react": 0.577.0). "other" (a rarer
 *  opendata.ch icon value, e.g. a ferry stop) falls back to Bus as the generic
 *  public-transit glyph rather than rendering nothing. */
function transitIconFor(type: TransitStopType) {
  if (type === "tram") return TramFront;
  if (type === "train") return TrainFront;
  return Bus;
}

/** Swiss opendata.ch stop names are city-prefixed ("Basel, Spalentor") — the non-
 *  "current" transit-chip treatments show only the stop name (owner feedback
 *  2026-07-24: "we don't need the city name"). Splits on the first comma; falls back
 *  to the untouched name when there's no comma (a minority of opendata.ch stop names
 *  carry no city prefix). */
function stripCityPrefix(name: string): string {
  const commaIndex = name.indexOf(",");
  if (commaIndex === -1) return name.trim();
  return name.slice(commaIndex + 1).trim();
}

/** "2 Min" — no trailing period (owner feedback 2026-07-24: "we don't need the
 *  point"). */
function formatWalkMinutes(walkMinutes: number): string {
  return `${walkMinutes} Min`;
}

/** tram/bus/train -> the German transit-type eyebrow word for the "labelled" chip
 *  treatment (owner feedback 2026-07-24: "we can't really identify what it is"). "Zug"
 *  (not "Bahn"/"Train") matches everyday CH German for a train stop. "other" is
 *  opendata.ch's rarer non-tram/bus/train icon value (e.g. a ferry stop) — "ÖV"
 *  (öffentlicher Verkehr, the generic Swiss "public transit" abbreviation) covers it
 *  without inventing a specific mode word. */
function transitTypeLabel(type: TransitStopType): string {
  if (type === "tram") return "Tram";
  if (type === "train") return "Zug";
  if (type === "bus") return "Bus";
  return "ÖV";
}

/**
 * TransitChip — the 3 superseded, non-"current" transit-chip treatments for the
 * card-overlay variant's floating info card, built for the /dev/pdp/transit direction
 * mockup (owner critique 2026-07-24 on the pre-redesign chip: "it's not really
 * balanced" / "we don't need the city name" / "we don't need the point" / "we can't
 * really identify what it is"). All 3 keep what the owner liked at the time: an icon
 * with the minutes underneath/beside it in blue, and the tram/train icon concept. The
 * owner's actual final pick was a 4th direction, not one of these — see "current" in
 * the card-overlay markup above (no badge, Footprints icon, stop moved onto the map).
 * These 3 stay reachable only via an explicit transitChipVariant prop, for
 * /dev/pdp/transit reference; no production caller passes them.
 */
function TransitChip({
  variant,
  Icon,
  stop,
}: {
  variant: "stacked-badge" | "inline-pill" | "labelled";
  Icon: LucideIcon;
  stop: NearestTransitStop;
}) {
  const name = stripCityPrefix(stop.name);
  const minutesLabel = formatWalkMinutes(stop.walkMinutes);

  // Direction A "Stacked badge" — a larger icon inside a sunken circle badge (legible
  // at a glance, the size the old bare 16px glyph couldn't manage), minutes directly
  // underneath in blue, stop name beneath that in ink. One tidy centered column.
  if (variant === "stacked-badge") {
    return (
      <span className="flex shrink-0 flex-col items-center gap-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-s-bg-sunken">
          <Icon size={18} strokeWidth={1.9} className="text-s-ink-2" />
        </span>
        <span className="text-[12px] font-bold leading-none text-s-accent">{minutesLabel}</span>
        <span className="max-w-[88px] truncate text-[10.5px] font-medium leading-none text-s-ink">{name}</span>
      </span>
    );
  }

  // Direction B "Inline pill" — a sunken pill holding icon + stop name, with the blue
  // minutes as a separate element to its right. The whole block bottom-aligns with the
  // address row (see the card-overlay <a>'s items-end for this variant), instead of
  // vertically centering against the whole two-line name+address block.
  if (variant === "inline-pill") {
    return (
      <span className="flex shrink-0 items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-s-bg-sunken px-2.5 py-1">
          <Icon size={14} strokeWidth={1.6} className="shrink-0 text-s-ink-2" />
          <span className="max-w-[76px] truncate text-[11.5px] font-medium text-s-ink">{name}</span>
        </span>
        <span className="text-[12px] font-bold text-s-accent">{minutesLabel}</span>
      </span>
    );
  }

  // Direction C "Labelled" — icon + the transit TYPE word ("Tram"/"Bus"/"Zug") as a
  // tiny uppercase eyebrow, stop name under it, minutes in blue under that. Answers
  // "what is this" twice over (glyph + word), not just once.
  return (
    <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
      <span className="flex items-center gap-1 text-s-ink-2">
        <Icon size={13} strokeWidth={2.25} className="shrink-0" />
        <span className="text-[9.5px] font-bold uppercase tracking-[0.08em]">{transitTypeLabel(stop.type)}</span>
      </span>
      <span className="max-w-[100px] truncate text-[12px] font-semibold text-s-ink">{name}</span>
      <span className="text-[11.5px] font-bold text-s-accent">{minutesLabel}</span>
    </span>
  );
}

// Single-salon framing zoom. MEASURED against the Solen Studio style's own definition
// (Mapbox Styles API, 2026-07-23): it's a Mapbox Standard-based style
// (`mapbox://styles/mapbox/standard` import) whose building layers
// (3d-building/procedural-buildings/2d-building) all carry `minzoom: 15` — the
// previous STREET_ZOOM=14.3 (borrowed from NearbyMap.tsx, which frames a whole CITY
// of salons) sat BELOW that threshold, so no building ever rendered, matching the
// owner's report ("can't see any details of the buildings... you can't see
// anything"). 17.0 clears minzoom 15 with real margin for individual-building
// legibility on a single-venue frame, and also clears building-number-label's
// minzoom:17, so the salon's building carries its street-number label too.
const STREET_ZOOM = 17;

/**
 * ROUND 3 (2026-07-24) — zoom CALIBRATED TO DISTANCE, replacing the hardcoded flat
 * `maxZoom: 15.5` that `fit()` used for every salon+stop pair regardless of how far
 * apart they actually are (owner: "zoom calibrated to distance, not a fixed
 * maxZoom... closer stop -> tighter zoom, farther stop -> wider, with sane clamps").
 *
 * Input is `distanceMeters` — the REAL straight-line distance
 * /api/transit/nearest-stop already returns (opendata.ch's own `distance` field, see
 * that route's header comment), not a derived/estimated number.
 *
 * Bands (closer -> tighter/higher zoom, farther -> wider/lower zoom), documented so
 * this is a system, not a magic number:
 *   <=150m    -> 16.0  Very close (e.g. right around the corner) — the pair barely
 *                       spans the frame even zoomed in, so go tight enough that
 *                       individual buildings (minzoom 15, see STREET_ZOOM above) stay
 *                       legible rather than wasting the extra room.
 *   151-250m  -> 15.5  The Spalentor fixture band (189m) — the exact value the owner
 *                       already reviewed and approved as "zoomed out further" in
 *                       round 2, kept as its own band so that specific, already-signed-
 *                       off framing doesn't shift under this system.
 *   251-400m  -> 15.0  A longer but still comfortably walkable stretch.
 *   401-600m  -> 14.5  Edge of comfortable walking distance — needs real breathing
 *                       room for both pins to read clearly with the stop this far off.
 *   >600m     -> 14.0  Floor clamp — a genuinely distant stop; never zoom out past
 *                       this or the salon pin gets lost among unrelated blocks.
 * Clamped to [14.0, 16.0] by construction (every branch returns a literal inside that
 * range) — never extrapolates past the documented bands.
 */
export function maxZoomForStopDistance(distanceMeters: number): number {
  if (distanceMeters <= 150) return 16.0;
  if (distanceMeters <= 250) return 15.5;
  if (distanceMeters <= 400) return 15.0;
  if (distanceMeters <= 600) return 14.5;
  return 14.0;
}

// mapDesign route source/layer ids — module-scope constants (not per-render) so the
// add/getSource/getLayer/removeLayer/removeSource calls in LocationMapCanvas's effect
// all agree on the same id, and a stray previous instance (rapid dep-array remount)
// never collides with a fresh one (guarded by the `map.getSource(...)` check before
// adding — see addRouteFeatures below).
const ROUTE_SOURCE_ID = "salon-walking-route";
const ROUTE_LAYER_ID = "salon-walking-route-line";

// Round-3 (2026-07-24) marker constants + per-direction pickers — module scope so
// storePinMarkerEl/transitCircleMarkerEl and LocationMapCanvas's effect all agree on
// the same numbers (the anchor-offset math in LocationMapCanvas depends on
// TRANSIT_CIRCLE_DIAMETER matching what transitCircleMarkerEl actually renders).
// TRANSIT_CIRCLE_DIAMETER reuses round 2's own circular store-marker size (34px) —
// the station now gets that exact geometry since the shapes swapped.
const STORE_PIN_WIDTH = 30; // matches pinMarkerEl's own rendered width — reusing its teardrop geometry, not a new shape
const STORE_PIN_HEIGHT = 40; // matches pinMarkerEl's own rendered height
const TRANSIT_CIRCLE_DIAMETER = 34;
const TRANSIT_CIRCLE_GLYPH_SIZE = Math.round(TRANSIT_CIRCLE_DIAMETER * 0.46);

/** "sunken" gets the s-bg-sunken fill on BOTH the store pin and the transit circle;
 *  every other direction (including the unreachable "current", which never calls
 *  either marker function) gets white. Shared by storePinMarkerEl and
 *  transitCircleMarkerEl now that round 3 swapped which shape is which — round 2's
 *  separate `storeMarkerFillFor` name is retired in favour of this more general one. */
function markerFillFor(mapDesign: "current" | "clean-white" | "ink-glyph" | "sunken"): "white" | "sunken" {
  return mapDesign === "sunken" ? "sunken" : "white";
}

/** ROUND 3 (2026-07-24): where the station-name pill attaches to its circle — "under"
 *  (stacked, centred under the circle) or "side" (a trailing chip beside it). Replaces
 *  round 2's `transitUnitColorFor` (per-direction ink/white/blue glyph colour), which
 *  is gone now that the transit glyph is fixed blue everywhere (owner: "a circle with
 *  a BLUE transit glyph"); pill attachment is the new per-direction axis instead.
 *  Direction B ("ink-glyph") gets "side" (paired with its route line, see
 *  addRouteFeatures); the other two get "under". Never called for "current". */
function pillAttachmentFor(mapDesign: "current" | "clean-white" | "ink-glyph" | "sunken"): "under" | "side" {
  return mapDesign === "ink-glyph" ? "side" : "under";
}

/** Minimal shape read off the real Mapbox Directions API response (walking profile,
 *  geometries=geojson) — used by mapDesign's route fetch below. Not the full Mapbox
 *  Directions type (this app has no dependency on @mapbox/mapbox-sdk); just the 2
 *  fields LocationMapCanvas actually reads. */
type MapboxDirectionsResponse = {
  routes?: Array<{
    geometry: { type: "LineString"; coordinates: [number, number][] };
  }>;
};

/**
 * LocationMapCanvas — live mapbox-gl render for a single salon, ported from
 * NearbyMap.tsx's init effect (dynamic-import-free static import + useEffect init is
 * safe here for the same reason: this file is already "use client", and the effect
 * only runs client-side, so nothing touches the DOM during SSR).
 *
 * Non-interactive (interactive:false — matches NearbyMap.tsx, disables scrollZoom /
 * dragPan / dragRotate / touchZoomRotate / keyboard / boxZoom / doubleClickZoom all at
 * once, so there's no gesture trap on a scrolling page) and attribution-minimal
 * (attributionControl:false, same as NearbyMap.tsx). The map surface itself carries no
 * tap behaviour (2026-07-23) — directions live in the caller's separate explicit link.
 */
function LocationMapCanvas({
  longitude,
  latitude,
  stylePath,
  label,
  transitStop,
  mapDesign = "current",
}: {
  longitude: number;
  latitude: number;
  stylePath: string;
  label: string;
  /** Nearest public-transport stop — rendered as a marker on the map itself (owner
   *  2026-07-24: no more tram icon/badge on the card; the station belongs on the
   *  map). Only card-overlay passes this; the other variants omit it and get no
   *  second marker. `distanceMeters` (round 3, 2026-07-24) feeds
   *  `maxZoomForStopDistance` below — the real straight-line distance
   *  /api/transit/nearest-stop already computes, not a derived value. */
  transitStop?: {
    latitude: number;
    longitude: number;
    type: TransitStopType;
    name?: string;
    walkMinutes: number;
    distanceMeters: number;
  } | null;
  /** In-map design direction — see SalonLocation's own mapDesign JSDoc above (file
   *  header; round-1 "path-pill" / "store-anchor" / "minimal" are gone, superseded by
   *  round 2, itself superseded by round 3's pin/circle/pill markers). Only
   *  card-overlay passes anything but the "current" default; the other variants omit
   *  it and render exactly as before. */
  mapDesign?: "current" | "clean-white" | "ink-glyph" | "sunken";
}) {
  const holder = React.useRef<HTMLDivElement>(null);
  const transitLat = transitStop?.latitude;
  const transitLng = transitStop?.longitude;
  const transitType = transitStop?.type;
  const transitName = transitStop?.name;
  const transitWalkMinutes = transitStop?.walkMinutes;
  const transitDistanceMeters = transitStop?.distanceMeters;

  React.useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !holder.current) return;
    mapboxgl.accessToken = token;

    const centre: [number, number] = [longitude, latitude];

    const map = new mapboxgl.Map({
      config: { basemap: SOLEN_BASEMAP_CONFIG }, // deterministic basemap config at init (avoids the on-load race)
      container: holder.current,
      style: `mapbox://styles/${stylePath}`,
      center: centre,
      zoom: STREET_ZOOM,
      interactive: false,
      attributionControl: false,
    });

    // Round 3 (2026-07-24): every non-"current" direction gets a PIN-shaped store
    // marker (storePinMarkerEl) instead of round 2's circle — "the owner likes the
    // store glyph but wants a PIN shape, not a full circle". Reuses pinMarkerEl's own
    // teardrop geometry (same anchor:"bottom", tip on the coordinate), white or sunken
    // fill, ink glyph, still never black / never ringed. "current" keeps the original
    // plain ink teardrop, untouched.
    const marker = new mapboxgl.Marker({
      element: mapDesign === "current" ? pinMarkerEl() : storePinMarkerEl({ fill: markerFillFor(mapDesign) }),
      anchor: "bottom",
    })
      .setLngLat(centre)
      .addTo(map);

    // Round 3: the station becomes a CIRCLE with an always-blue transit glyph (the
    // shapes literally swap with the store pin above), and the station name moves
    // into ONE pill shape attached to the circle instead of round 2's bare
    // glyph-above-name text (owner: "the bare text label is rejected... put the
    // station name inside one pill/shape"). `pillAttachmentFor` picks where that pill
    // attaches ("under" the circle, centred, vs "beside" it) — the anchor/offset pair
    // below is chosen per attachment so the CIRCLE's own centre (not the pill, not the
    // element's full bounding box) sits exactly on the stop's coordinate, same
    // precision goal as round 2's glyph-centring math. "current" keeps the original
    // dot-badge transitMarkerEl, untouched.
    let transitMarker: MapboxMarker | null = null;
    if (transitLat != null && transitLng != null && transitType != null) {
      const stopName = transitName ? stripCityPrefix(transitName) : undefined;
      if (mapDesign === "current") {
        transitMarker = new mapboxgl.Marker({ element: transitMarkerEl(transitType, stopName) })
          .setLngLat([transitLng, transitLat])
          .addTo(map);
      } else {
        const attachment = pillAttachmentFor(mapDesign);
        const element = transitCircleMarkerEl({ type: transitType, name: stopName, fill: markerFillFor(mapDesign), attachment });
        const radius = TRANSIT_CIRCLE_DIAMETER / 2;
        transitMarker =
          attachment === "under"
            ? new mapboxgl.Marker({ element, anchor: "top", offset: [0, -radius] })
                .setLngLat([transitLng, transitLat])
                .addTo(map)
            : new mapboxgl.Marker({ element, anchor: "left", offset: [-radius, 0] })
                .setLngLat([transitLng, transitLat])
                .addTo(map);
      }
    }

    // Same below-the-fold 0px-container guard as NearbyMap.tsx: on first mount the
    // section can measure 0px high before layout settles, which mapbox then bakes
    // into a degenerate viewport. Re-fit after resize, and keep resizing while the
    // element settles.
    const fit = () => {
      map.resize();
      // With a nearest stop, frame BOTH points. Measured: a fixed setZoom(STREET_ZOOM)
      // put the Spalentor stop (189 m away) outside the viewport entirely, and it also
      // clobbered any earlier fitBounds because this runs on every load/resize.
      // Zoomed out further (2026-07-24, owner: "zoom out 30-40%") — maxZoom 17 -> a flat
      // 15.5 (the low end of the owner-given 15.5-16 range) and padding raised ~33% on
      // every side (48->64, 104->140) so the salon+stop pair reads with real margin
      // instead of nearly filling the frame. ROUND 3 (2026-07-24, same day): the owner
      // wants zoom CALIBRATED TO DISTANCE instead of that one flat number — closer stop
      // -> tighter zoom, farther stop -> wider. `maxZoomForStopDistance` (below) replaces
      // the hardcoded 15.5; the Spalentor fixture (189m) lands in that function's own
      // 151-250m band, which is pinned to 15.5 specifically so the owner-reviewed round-2
      // framing doesn't shift under the one stop they already approved. Padding logic is
      // unchanged. Applies to every direction, including "current" (production) —
      // reported against the whole map, not one mockup direction.
      if (transitLng != null && transitLat != null) {
        const maxZoom = transitDistanceMeters != null ? maxZoomForStopDistance(transitDistanceMeters) : 15.5;
        map.fitBounds(
          [
            [Math.min(longitude, transitLng), Math.min(latitude, transitLat)],
            [Math.max(longitude, transitLng), Math.max(latitude, transitLat)],
          ],
          { padding: { top: 64, bottom: 140, left: 64, right: 64 }, maxZoom, duration: 0 },
        );
        return;
      }
      map.setCenter(centre);
      map.setZoom(STREET_ZOOM);
    };
    map.on("load", fit);
    // Owner reference (2026-07-24): POI icons + labels, street names, place labels, grey
    // buildings — this style ships those flags off by default (lib/map-style.ts). Must run
    // after "load" (style is ready by then), never before.
    map.on("load", () => applySolenBasemapConfig(map));

    // Round 2 (2026-07-24): the owner questioned whether a manually-fetched route line
    // "holds up when scaled" — treated as a genuine per-direction choice, not a given.
    // Only "ink-glyph" (Direction B) drew one at first, for direct comparison against
    // "clean-white" (no route at all) and "sunken" (also none). ROUND 3 (2026-07-24,
    // same day): that route line became a bold, near-full-opacity blue dotted trail
    // (see addRouteFeatures's paint block below) instead of round 2's thin/low-opacity
    // version — same per-direction choice of whether to draw one at all, just louder
    // where it does render. ROUND 4 (2026-07-24, same day): "clean-white" is now the
    // PRODUCTION default AND draws this same route ("Direction A, but with dots" —
    // the owner's decision) — "sunken" is the only direction left with none. The
    // on-map walking-time pill from round 1 stays deleted outright — no direction
    // renders it (owner: "he does not want it on the map at all"). Fetched live from
    // Mapbox Directions using the same public token the map itself already renders
    // with — never a fabricated straight line; degrades to no route on any fetch
    // failure, the same graceful-degrade contract as the transit-stop fetch above
    // this component.
    let cancelled = false;

    async function addRouteFeatures() {
      if (mapDesign !== "ink-glyph" && mapDesign !== "clean-white") return;
      if (transitLat == null || transitLng == null) return;
      try {
        const url =
          `https://api.mapbox.com/directions/v5/mapbox/walking/${longitude},${latitude};${transitLng},${transitLat}` +
          `?geometries=geojson&overview=full&access_token=${token}`;
        const res = await fetch(url);
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as MapboxDirectionsResponse;
        const route = json.routes?.[0];
        if (!route?.geometry || cancelled) return;
        if (map.getSource(ROUTE_SOURCE_ID)) return;

        map.addSource(ROUTE_SOURCE_ID, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: route.geometry },
        });
        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#276EF1", // drift-ok: token s-accent, inline for Mapbox GL paint (not a Tailwind/JSX context)
            "line-width": 2.5, // round 3: a touch bolder than round 2's 2px thin line
            "line-dasharray": [0, 2.2], // round 3: denser dots than round 2's [0, 2.8] — reads as a clearer trail
            // round 3 (2026-07-24, owner: "increase the dotted route's saturation/opacity toward full s-accent —
            // currently low-opacity on some directions") — up from round 2's 0.45, near-full strength blue
            "line-opacity": 0.9,
          },
        });
      } catch {
        // Degrade gracefully: no route line, never a fabricated straight-line fallback.
      }
    }
    map.on("load", () => {
      void addRouteFeatures();
    });

    const ro = new ResizeObserver(fit);
    ro.observe(holder.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      marker.remove();
      transitMarker?.remove();
      if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
      if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
      map.remove();
    };
  }, [longitude, latitude, stylePath, transitLat, transitLng, transitType, transitName, transitWalkMinutes, transitDistanceMeters, mapDesign]);

  return (
    // h-full, NOT `absolute inset-0`: mapbox-gl.css sets `.mapboxgl-map { position: relative }`
    // on this node once the map mounts, which beats an absolute utility and collapses the
    // element to 0px (same finding as NearbyMap.tsx). An explicit height is immune to that.
    <div ref={holder} className="h-full w-full" role="img" aria-label={label} />
  );
}

/** Solen pin — ink teardrop + white centre dot, tip on the coordinate. Built as a raw
 *  DOM element (not JSX) because mapboxgl.Marker's `element` option requires one; the
 *  markup is a STATIC SVG string (no interpolation), same safe pattern as
 *  NearbyMap.tsx's markerEl(). anchor:"bottom" (set where this is used) puts the tip
 *  — not the element's centre — on the marker's lng/lat. */
function pinMarkerEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.35))";
  el.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 32" width="30" height="40" style="display:block">' +
    '<path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.373 18.627 0 12 0Z" fill="#0A0A0A"/>' + // drift-ok: token s-ink, inline for vanilla-DOM marker
    '<circle cx="12" cy="12" r="4.25" fill="#FFFFFF"/></svg>';
  return el;
}

/** lucide-react's "Store" icon path data, copied verbatim (same safe static-SVG-string
 *  pattern as transitGlyphPaths below — node_modules/lucide-react/dist/esm/icons/store.js,
 *  lucide-react 0.577.0). Used by storePinMarkerEl for the round-3 pin-shaped
 *  destination marker shared by every non-"current" mapDesign direction. */
function storeGlyphPaths(): string {
  return (
    '<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/>' +
    '<path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/>' +
    '<path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>'
  );
}

/** ROUND 3 (2026-07-24) — the store marker becomes a PIN (owner: "the owner likes the
 *  store glyph but wants a PIN shape, not a full circle"), reusing pinMarkerEl's own
 *  teardrop path verbatim (same viewBox, same 30x40 render size, same anchor:"bottom"
 *  tip-on-coordinate contract) instead of round 2's full circle. `fill` still picks
 *  white (hairline s-border edge) or sunken (tonal, no border) — never black, never
 *  accent-ringed, same guardrail as round 2's storeMarkerEl. The Store glyph sits
 *  inset in the pin's circular head (viewBox y 0-24, centred (12,12), radius 12),
 *  scaled + translated so its own centre lands on that same point. "current" never
 *  calls this — it keeps the original plain ink teardrop (pinMarkerEl, no glyph). */
function storePinMarkerEl({ fill }: { fill: "white" | "sunken" }): HTMLDivElement {
  const el = document.createElement("div");
  el.style.filter = "drop-shadow(0 2px 5px rgba(10,10,10,0.22))"; // soft shadow — not pinMarkerEl's heavier 0.35-alpha black-teardrop shadow
  const background = fill === "white" ? "#FFFFFF" : "#F4F4F5"; // drift-ok: white + token s-bg-sunken, inline for vanilla-DOM marker
  const pinFill =
    fill === "white"
      ? `<path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.373 18.627 0 12 0Z" fill="${background}" stroke="#E4E4E7" stroke-width="1"/>` // drift-ok: white fill + token s-border stroke, inline for vanilla-DOM marker
      : `<path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.373 18.627 0 12 0Z" fill="${background}"/>`; // drift-ok: token s-bg-sunken, inline for vanilla-DOM marker
  const glyphScale = 0.56; // fraction of the Store glyph's own 24x24 viewBox that fits inside the pin's 24-wide circular head without touching its edge
  const glyphOffset = (12 - 12 * glyphScale).toFixed(2); // centres the scaled glyph on the head's own (12,12) centre
  el.innerHTML =
    `<svg aria-hidden="true" viewBox="0 0 24 32" width="${STORE_PIN_WIDTH}" height="${STORE_PIN_HEIGHT}" style="display:block">` +
    pinFill +
    `<g transform="translate(${glyphOffset},${glyphOffset}) scale(${glyphScale})" fill="none" stroke="#0A0A0A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${storeGlyphPaths()}</g>` + // drift-ok: token s-ink, inline for vanilla-DOM marker
    "</svg>";
  return el;
}

/** tram/bus/train -> the matching lucide-react glyph's OWN static path data (copied
 *  verbatim from node_modules/lucide-react/dist/esm/icons/{tram-front,train-front,bus}.js,
 *  2026-07-24 — lucide-react 0.577.0), used as a static SVG string (no interpolation,
 *  same safe innerHTML pattern as pinMarkerEl/NearbyMap.tsx's markerEl). "other" (a
 *  rarer opendata.ch icon value) falls back to Bus, matching transitIconFor's own
 *  fallback above. */
function transitGlyphPaths(type: TransitStopType): string {
  if (type === "tram") {
    return (
      '<rect width="16" height="16" x="4" y="3" rx="2"/>' +
      '<path d="M4 11h16"/><path d="M12 3v8"/>' +
      '<path d="m8 19-2 3"/><path d="m18 22-2-3"/>' +
      '<path d="M8 15h.01"/><path d="M16 15h.01"/>'
    );
  }
  if (type === "train") {
    return (
      '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/>' +
      '<path d="m9 15-1-1"/><path d="m15 15 1-1"/>' +
      '<path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/>' +
      '<path d="m8 19-2 3"/><path d="m16 19 2 3"/>'
    );
  }
  return (
    '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>' +
    '<path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>' +
    '<circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>'
  );
}

/** Nearest public-transport stop marker for "current" (production) — a compact 16px
 *  s-accent dot (default anchor = center, not "bottom" — this marks a point, it
 *  doesn't need a tip) with a tiny white transit glyph, station name in a small white
 *  pill beside it. Round 2 (2026-07-24) replaced this shape for every OTHER direction
 *  with transitUnitMarkerEl (round 3's transitCircleMarkerEl now, see below) — "current"
 *  keeps this exact original markup, untouched. */
function transitMarkerEl(type: TransitStopType, name?: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.filter = "drop-shadow(0 1px 3px rgba(0,0,0,0.3))";
  // Owner 2026-07-24: the station NAME + transit glyph belong on the map (that is why
  // the card chip no longer carries the name). Label sits beside the dot.
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.gap = "4px";
  el.style.whiteSpace = "nowrap";
  el.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:9999px;' +
    'background:#276EF1;border:2px solid #ffffff;box-sizing:border-box;">' + // drift-ok: token s-accent + white, inline for vanilla-DOM marker
    `<svg aria-hidden="true" viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#ffffff" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">${transitGlyphPaths(type)}</svg>` +
    "</div>" +
    (name
      ? '<span style="font:600 11px/1.1 Inter,system-ui,sans-serif;color:#0A0A0A;background:rgba(255,255,255,0.92);' +
        'padding:2px 5px;border-radius:6px;">' + name + "</span>"
      : "");
  return el;
}

/** ROUND 3 (2026-07-24) transit-stop marker for "clean-white" / "ink-glyph" /
 *  "sunken" — the station becomes a CIRCLE (round 2's store-marker geometry, reused
 *  now that the shapes swapped) holding an always-BLUE (`s-accent` #276EF1) transit
 *  glyph, and the station name sits inside ONE pill shape attached to that circle
 *  (owner: "a circle with a BLUE transit glyph"; "the bare text label is rejected...
 *  put the station name inside one pill/shape") — replacing round 2's bare
 *  glyph-above-name unit outright. `fill` mirrors storePinMarkerEl's own white/sunken
 *  choice (never black, never a colour outside the token ramp). `attachment` picks
 *  where the pill sits: "under" the circle (stacked, centred) or "side" (a trailing
 *  chip). Caller anchors this marker so the CIRCLE's own centre — not the pill, not
 *  the element's full bounding box — sits exactly on the stop's coordinate (same
 *  precision goal round 2 held for its glyph). */
function transitCircleMarkerEl({
  type,
  name,
  fill,
  attachment,
}: {
  type: TransitStopType;
  name: string | undefined;
  fill: "white" | "sunken";
  attachment: "under" | "side";
}): HTMLDivElement {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.flexDirection = attachment === "under" ? "column" : "row";
  el.style.alignItems = "center";
  el.style.gap = attachment === "under" ? "4px" : "6px";
  el.style.whiteSpace = "nowrap";
  el.style.filter = "drop-shadow(0 1px 3px rgba(10,10,10,0.22))";

  const circleBackground = fill === "white" ? "#FFFFFF" : "#F4F4F5"; // drift-ok: white + token s-bg-sunken, inline for vanilla-DOM marker
  const circleBorder = fill === "white" ? "1px solid #E4E4E7" : "none"; // drift-ok: token s-border, inline for vanilla-DOM marker
  const circle =
    `<div style="width:${TRANSIT_CIRCLE_DIAMETER}px;height:${TRANSIT_CIRCLE_DIAMETER}px;border-radius:9999px;background:${circleBackground};` +
    `border:${circleBorder};box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-shrink:0;">` +
    `<svg aria-hidden="true" viewBox="0 0 24 24" width="${TRANSIT_CIRCLE_GLYPH_SIZE}" height="${TRANSIT_CIRCLE_GLYPH_SIZE}" fill="none" stroke="#276EF1" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${transitGlyphPaths(type)}</svg>` + // drift-ok: token s-accent, inline for vanilla-DOM marker
    "</div>";

  // Pill fill mirrors the circle's own fill (white-with-border or sunken-no-border) —
  // "every shape reads as one tonal family" for the sunken direction, same as
  // storePinMarkerEl's pin.
  const pillBackground = fill === "white" ? "#FFFFFF" : "#F4F4F5"; // drift-ok: white + token s-bg-sunken, inline for vanilla-DOM marker
  const pillBorder = fill === "white" ? "1px solid #E4E4E7" : "none"; // drift-ok: token s-border, inline for vanilla-DOM marker
  const pill = name
    ? `<span style="display:inline-block;max-width:120px;overflow:hidden;text-overflow:ellipsis;` +
      `font:600 11px/1.1 Inter,system-ui,sans-serif;color:#0A0A0A;background:${pillBackground};` + // drift-ok: token s-ink text, inline for vanilla-DOM marker
      `border:${pillBorder};border-radius:9999px;padding:3px 9px;">${name}</span>`
    : "";

  el.innerHTML = circle + pill;
  return el;
}
