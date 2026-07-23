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
 *
 * These 3 frames are the round-2 replacement — "clean-white" / "ink-glyph" / "sunken"
 * — all sharing a white-or-sunken (never black), ring-free circular store marker and
 * the new glyph-above-name transit unit; they differ in store-marker fill,
 * transit-unit colour, and whether the route line renders at all.
 *
 * Fixture: "Barbershop Spalentor", Basel — coordinates 47.5589 / 7.5791. The nearest
 * real transit stop (transport.opendata.ch, live, no mock data) resolves to
 * {name: "Basel, Spalentor", type: "tram", distanceMeters: 189, walkMinutes: 2}.
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
          Mockup — PDP map INTERIOR, round 2, 3 in-map design directions
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
          <code className="rounded bg-white px-1 py-0.5 text-[12px]">/api/transit/nearest-stop</code>; Direction B's
          route line additionally comes from the live Mapbox Directions API.
        </p>

        <div className="mt-3 rounded-2xl border border-s-border bg-white p-3.5 text-[12.5px] leading-snug text-s-ink-2">
          <span className="font-semibold text-s-ink">Round-2 owner feedback: </span>no black store marker, no
          accent-blue ring, no on-map time pill, transit glyph + station name as one centred unit, no POI/place/street
          labels, no 3D landmarks, and a wider salon+stop frame. The last 4 are global fixes (
          <code className="rounded bg-s-bg-sunken px-1 py-0.5 text-[11.5px]">applySolenBasemapConfig</code> + the
          shared <code className="rounded bg-s-bg-sunken px-1 py-0.5 text-[11.5px]">fit()</code> zoom) — identical
          across all 3 directions below AND in production, not part of what's being compared. The floating
          name/address/time card is also untouched in all 3 — this mockup is scoped to the map interior only, per the
          ask.
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[430px] flex-col gap-10">
        <PhoneFrame
          label="Direction A — Clean white"
          rationale="White circular store marker with an ink glyph, hairline s-border, and a soft shadow. The transit stop is a blue glyph directly above the blue stop name, no background at all. No route line — tests whether the path is even needed to understand the walk."
        >
          <SalonLocation salon={SALON} variant="card-overlay" mapDesign="clean-white" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction B — Ink glyph on white"
          rationale="The same white circular store marker as A, but the transit unit is ink instead of blue — glyph and stop name both read as plain content, not a link. Keeps a very subtle, thin, low-opacity dotted route so it can be judged directly against A's no-route choice."
        >
          <SalonLocation salon={SALON} variant="card-overlay" mapDesign="ink-glyph" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction C — Sunken"
          rationale="The store marker sits on an s-bg-sunken circle instead of white, still an ink glyph, still no ring. The transit unit flips to white with a soft dark shadow for legibility on the light basemap. No route line."
        >
          <SalonLocation salon={SALON} variant="card-overlay" mapDesign="sunken" />
        </PhoneFrame>
      </div>
    </main>
  );
}
