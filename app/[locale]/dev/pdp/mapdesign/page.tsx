"use client";

/**
 * /dev/pdp/mapdesign — 1:1 REAL-COMPONENT mockup, 3 IN-MAP design directions for the
 * salon PDP "Standort" map itself (not the floating card — see the `mapDesign` prop's
 * own JSDoc on SalonLocation.tsx for that scoping decision). Imports the ACTUAL
 * shipping component (SalonLocation, app/[locale]/_components/salon/SalonLocation.tsx)
 * with its `mapDesign` prop — every existing caller omits the prop and renders the
 * exact pre-existing map, unchanged. No forked copy of the component.
 *
 * ROUND 2 (2026-07-24, same day) — the owner reviewed round 1 (the Lime-reference
 * "path-pill" / "store-anchor" / "minimal" directions) and rejected it wholesale:
 *  - the store marker was a BLACK circle with an accent-BLUE ring — "it must NOT be
 *    black, and the blue ring around it must go [off design system]".
 *  - the dark on-map walking-time pill — "he does not want it on the map at all".
 *  - the transit glyph + station name didn't read as ONE element — glyph must sit
 *    directly ABOVE the name, centred, no circle/pill/background chip.
 *  - a 3D landmark rendered near the Spalentor stop, and street/place/POI labels were
 *    on — both reversed globally in `applySolenBasemapConfig` (lib/map-style.ts), not
 *    something this mockup controls per-direction.
 *  - the salon+stop frame sat too tight — zoomed out further in the shared `fit()`
 *    logic (SalonLocation.tsx), also not a per-direction control.
 *  - the dotted walking route's own future ("did you draw it yourself... not really
 *    feasible when we scale it up") is treated below as a genuine per-direction
 *    choice, not a given.
 * Round 2's replacement was 3 frames — "clean-white" / "ink-glyph" / "sunken" — all
 * sharing a white-or-sunken (never black), ring-free CIRCULAR store marker and a
 * glyph-above-name transit unit.
 *
 * ROUND 3 (2026-07-24, same day) — the owner reviewed round 2 and asked for further
 * iteration, not a rejection: the map basemap itself read "so empty, like all white"
 * (fixed globally in `applySolenBasemapConfig` — `colorLand`/`colorBuildings`, not a
 * per-direction control, applies here AND in production); the store marker should be
 * a PIN, not a circle (owner liked the glyph, wanted the shape changed); the station
 * should become the CIRCLE instead, holding an always-BLUE transit glyph (the shapes
 * swap); the station name must sit inside ONE pill/shape, not bare text; and the
 * dotted route line should read as saturated, near-full-opacity blue instead of the
 * low-opacity line round 2 shipped. Zoom is ALSO no longer a flat number — `fit()`
 * now calibrates `maxZoom` to the real stop distance via `maxZoomForStopDistance`
 * (SalonLocation.tsx), a global change reported against the whole map, not one frame.
 *
 * These 3 frames are the round-3 replacement — same 3 `mapDesign` keys as round 2
 * ("clean-white" / "ink-glyph" / "sunken"), completely rewritten internals: all 3 now
 * carry the pin-shaped store marker + blue-glyph circular station marker + one-shape
 * name pill; they differ in pill attachment (under the circle vs beside it), marker
 * fill (white vs sunken), and whether the boosted-blue dotted route renders at all.
 *
 * Fixture: "Barbershop Spalentor", Basel — coordinates 47.5589 / 7.5791. The nearest
 * real transit stop (transport.opendata.ch, live, no mock data) resolves to
 * {name: "Basel, Spalentor", type: "tram", distanceMeters: 189, walkMinutes: 2}. At
 * 189m this fixture lands in maxZoomForStopDistance's own 151-250m band (-> 15.5),
 * the same value the owner already reviewed and approved in round 2.
 * Direction B ("ink-glyph") additionally makes a live fetch to the real Mapbox
 * Directions API (walking profile) for its route line — MEASURED (2026-07-24, curled
 * directly against this exact salon+stop pair): distance 191.531m, duration 131.372s,
 * a 14-point route.geometry.coordinates polyline. Nothing here is a hardcoded
 * fallback number or a straight-line approximation.
 *
 * Exists-check: no prior /dev/pdp/mapdesign route, no prior in-map route/pill/glyph
 * rendering anywhere in the codebase before round 1 (grepped addLayer/line-dasharray/
 * directions/v5 — 0 matches outside node_modules) — net-new, not a duplicate of
 * /dev/pdp/location or /dev/pdp/transit (those cover the OUTER variant/chip, this
 * covers the map interior).
 */
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { SalonDetail } from "@/app/[locale]/_components/salon/_shared";
import { SalonLocation } from "@/app/[locale]/_components/salon/SalonLocation";

// Fixture — same Barbershop Spalentor fixture as /dev/pdp/transit (real Spalentor tram
// stop, real Directions-API route — see file header). Not a real business record;
// built only to exercise the real SalonDetail type + render the real component.
const SALON: SalonDetail = {
  id: "dev-fixture-barbershop-spalentor",
  name: "Barbershop Spalentor",
  slug: "barbershop-spalentor-basel",
  description_de: "Barbershop im Basler Altstadt-Grossbasel, direkt am Spalentor.",
  description_en: null,
  about_text_de: "Barbershop Spalentor liegt im historischen Grossbasel, wenige Schritte vom Spalentor entfernt.",
  about_text_en: null,
  categories: ["barbershop"],
  quartier: "Altstadt Grossbasel",
  address: "Spalenberg 12, 4051 Basel",
  postal_code: "4051",
  latitude: 47.5589,
  longitude: 7.5791,
  phone: "+41 61 555 98 76",
  website_url: null,
  instagram_url: null,
  tiktok_url: null,
  cover_photo_url: null,
  gallery_urls: [],
  opening_hours: null,
  average_rating: 4.9,
  review_count: 22,
  last_minute_discount_percent: 0,
  accepts_online_payment: true,
  free_cancel_hours: 24,
  booking_confirmation_mode: "instant",
  services: [],
  staff: [],
  reviews: [],
};

function PhoneFrame({ label, rationale, children }: { label: string; rationale: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[390px]">
      <p className="text-[15px] font-bold text-s-ink">{label}</p>
      <p className="mt-1 text-[13px] leading-snug text-s-ink-2">{rationale}</p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-s-border bg-white shadow-elevation-2">
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function PdpMapDesignMockup() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[430px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-3">
          Mockup — PDP map INTERIOR, round 3, 3 in-map design directions
        </p>
        <h1 className="mt-1 font-heading text-[20px] font-bold text-s-ink">
          The real SalonLocation map canvas, 3 treatments
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-snug text-s-ink-2">
          Every frame below renders the actual shipping{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[12px]">SalonLocation</code> component in its shipping{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[12px]">card-overlay</code> variant, with a different{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[12px]">mapDesign</code> prop. Fixture: Barbershop
          Spalentor, Basel — the transit stop (Spalentor · Tram · 189 m · 2 Min) comes from a real, live call to{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[12px]">/api/transit/nearest-stop</code>; Direction B&apos;s
          route line additionally comes from the live Mapbox Directions API.
        </p>

        <div className="mt-3 rounded-2xl border border-s-border bg-white p-3.5 text-[12.5px] leading-snug text-s-ink-2">
          <span className="font-semibold text-s-ink">Round-3 owner feedback: </span>map read &quot;so empty, like all
          white&quot; (buildings now clearly darker than the ground), store marker is a PIN not a circle, the station is
          now the CIRCLE with an always-blue glyph, the station name sits inside one pill shape, the dotted route is
          bolder/more saturated blue, and zoom is calibrated to the real stop distance instead of one fixed number.
          The first and last 2 are global fixes (
          <code className="rounded bg-s-bg-sunken px-1 py-0.5 text-[11.5px]">applySolenBasemapConfig</code> +{" "}
          <code className="rounded bg-s-bg-sunken px-1 py-0.5 text-[11.5px]">maxZoomForStopDistance</code>) — identical
          across all 3 directions below AND in production, not part of what&apos;s being compared. The floating
          name/address/time card is also untouched in all 3 — this mockup is scoped to the map interior only, per the
          ask.
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[430px] flex-col gap-10">
        <PhoneFrame
          label="Direction A — Pin + pill under, white"
          rationale="White pin-shaped store marker with an ink Store glyph; white circular station marker with a blue transit glyph, name pill stacked directly under it. No route line — the quietest of the 3, testing whether the pins alone read clearly enough without a path."
        >
          <SalonLocation salon={SALON} variant="card-overlay" mapDesign="clean-white" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction B — Pin + pill beside, routed"
          rationale="Same white pin + blue-glyph circle as A, but the station name pill trails beside the circle instead of stacking under it — useful when vertical space over the stop is tight. Adds the bold, near-full-opacity blue dotted walking route for direct comparison against A and C's no-route choice."
        >
          <SalonLocation salon={SALON} variant="card-overlay" mapDesign="ink-glyph" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction C — Sunken, pill under"
          rationale="Same pin + circle + under-pill layout as A, but every shape (pin, circle, pill background) sits on the s-bg-sunken tone instead of white — a softer, more tonal reading with no hairline borders. No route line."
        >
          <SalonLocation salon={SALON} variant="card-overlay" mapDesign="sunken" />
        </PhoneFrame>
      </div>
    </main>
  );
}
