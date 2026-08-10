"use client";

/**
 * /dev/pdp/location — 1:1 REAL-COMPONENT mockup, 3 directions for the salon PDP
 * "Standort" (location) section. Earlier hand-drawn HTML mockups were rejected
 * by the owner — this route imports the ACTUAL shipping component
 * (SalonLocation, app/[locale]/_components/salon/SalonLocation.tsx) and
 * renders it 3x with a different `variant` prop each, so what the owner picks
 * between is literally what ships. No forked copy of the component.
 *
 * Exists-check: `npm run exists pdp/location` = 0 (new route, verified before build).
 * Fixture: "Cuts & Culture", Basel, 4.8 · 16 reviews — hardcoded SalonDetail
 * object below. `services`/`staff`/`reviews` are empty arrays: SalonLocation only
 * reads salon.name/address/latitude/longitude — the rest of the object exists
 * purely to satisfy the real SalonDetail type (no `any` cast).
 *
 * A = current shipped map (variant="map", the untouched default — every other
 *     caller of SalonLocation omits the prop and is unaffected).
 * B = card overlay (variant="card-overlay") — new OPTIONAL prop added to the
 *     real component, default behaviour unchanged.
 * C = compact strip (variant="compact") — same mechanism.
 *
 * Mapbox note (owner 2026-07-23): the map now renders Solen's own Studio style via mapbox-gl (lib/map-style.ts).
 * A properly BRANDED look needs a custom Mapbox Studio style ID the owner has
 * to create in Mapbox Studio and supply — not invented here (CLAUDE.md "don't
 * invent locked values"; see the callout on the page). All 3 directions below
 * use the same stock `mapbox/light-v11` style already shipping in SalonLocation.
 */
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { SalonDetail } from "@/app/[locale]/_components/salon/_shared";
import { SalonLocation } from "@/app/[locale]/_components/salon/SalonLocation";

// Fixture — Cuts & Culture, a Basel barbershop. Not a real business record; built
// only to exercise the real SalonDetail type + render the real component.
const SALON: SalonDetail = {
  id: "dev-fixture-cuts-culture",
  name: "Cuts & Culture",
  slug: "cuts-culture-basel",
  description_de: "Barbershop in Basel — Fades, Bartpflege, klassische Rasur.",
  description_en: null,
  about_text_de: "Cuts & Culture ist ein Barbershop im Kleinbasel mit Fokus auf präzise Fades und traditionelle Nassrasuren.",
  about_text_en: null,
  categories: ["barbershop"],
  quartier: "Kleinbasel",
  address: "Feldbergstrasse 24, 4057 Basel",
  postal_code: "4057",
  latitude: 47.5657,
  longitude: 7.5951,
  phone: "+41 61 555 12 34",
  website_url: null,
  instagram_url: null,
  tiktok_url: null,
  cover_photo_url: null,
  gallery_urls: [],
  opening_hours: null,
  average_rating: 4.8,
  review_count: 16,
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

export default function PdpLocationMockup() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[430px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">Mockup — PDP "Standort" section, 3 directions</p>
        <h1 className="mt-1 font-heading text-[20px] font-bold text-s-ink">The real SalonLocation component, 3 treatments</h1>
        <p className="mt-1.5 text-[13.5px] leading-snug text-s-ink-2">
          Every frame below renders the actual shipping <code className="rounded bg-white px-1 py-0.5 text-[12px]">SalonLocation</code> component
          (<code className="rounded bg-white px-1 py-0.5 text-[12px]">app/[locale]/_components/salon/SalonLocation.tsx</code>) with a different{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[12px]">variant</code> prop. Fixture: Cuts &amp; Culture, Basel — 4.8 · 16 reviews.
        </p>

        <div className="mt-3 rounded-2xl border border-s-border bg-white p-3.5 text-[12.5px] leading-snug text-s-ink-2">
          <span className="font-semibold text-s-ink">Map note: </span>
          all 3 directions below use the stock Mapbox <code className="rounded bg-s-bg-sunken px-1 py-0.5 text-[11.5px]">light-v11</code> style,
          same as today — the map now renders Solen's canonical Studio style via mapbox-gl. Directions D/E override with stock styles for comparison only;
          not invented here.
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[430px] flex-col gap-10">
        <PhoneFrame
          label="Direction A - Current map"
          rationale={`Shipped today: full-width 4:3 static map, ink pin, plain address row + "Wegbeschreibung" link below it.`}
        >
          <SalonLocation salon={SALON} variant="map" mapStyle="light-v11" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction B - Card overlay"
          rationale={`Same 4:3 map, but a white name / address / walk-time card floats over its bottom edge instead of a separate address row. The transit chip now shows the nearest tram/bus stop with minutes computed from real coordinates — no placeholder number.`}
        >
          <SalonLocation salon={SALON} variant="card-overlay" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction C - Compact strip"
          rationale={`Shorter 2:1 map with the address + "Wegbeschreibung" beside it instead of below it — trims the section's vertical footprint.`}
        >
          <SalonLocation salon={SALON} variant="compact" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction D - Softer style (navigation-day)"
          rationale={"Same layout as A, but the tile uses the stock navigation-day-v1 style instead of the flat grey light-v11 - warmer, more depth. No custom Studio style and no new token needed."}
        >
          <SalonLocation salon={SALON} mapStyle="navigation-day-v1" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction E - Full colour (streets)"
          rationale={"Same layout as A with the stock streets-v12 style - the most colour and detail available without a custom Studio style. Pick this if A and D still read too washed out."}
        >
          <SalonLocation salon={SALON} mapStyle="streets-v12" />
        </PhoneFrame>
      </div>
    </main>
  );
}
