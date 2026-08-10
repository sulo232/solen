"use client";

/**
 * /dev/pdp/transit — 1:1 REAL-COMPONENT mockup, 3 directions for the PDP "Standort"
 * card-overlay's transit chip (the small icon + minutes badge on the right of the
 * floating name/address card). Imports the ACTUAL shipping component
 * (SalonLocation, app/[locale]/_components/salon/SalonLocation.tsx) with its new
 * OPTIONAL `transitChipVariant` prop — every existing caller omits the prop and
 * renders the exact pre-existing chip, unchanged. No forked copy of the component.
 *
 * Exists-check: `npm run exists pdp/transit` = 0 and `npm run exists transit chip`
 * = 0 (new route, verified before build).
 *
 * OWNER CRITIQUE of the shipped chip (verbatim, 2026-07-24):
 *  - "it's not really balanced" — the alignment is off.
 *  - "we don't need the city name" — opendata.ch returns "Basel, Spalentor"; show only
 *    the stop name ("Spalentor"). Basel and other Swiss cities prefix the city name —
 *    stripped client-side (SalonLocation.tsx's stripCityPrefix).
 *  - "we don't need the point" — "2 Min." loses the trailing period -> "2 Min".
 *  - "we can't really identify what it is" — the transit icon isn't legible at 16px.
 *  - Kept, because the owner likes it: an icon with the minutes underneath/beside it
 *    in blue, and the tram/train icon concept.
 *
 * Fixture: "Barbershop Spalentor", Basel — coordinates 47.5589 / 7.5791, which the
 * REAL /api/transit/nearest-stop endpoint (transport.opendata.ch, no mock data) is
 * measured (2026-07-24, curled directly against the running dev server) to resolve to
 * {name: "Basel, Spalentor", type: "tram", distanceMeters: 189, walkMinutes: 2} — the
 * exact real-world stop/distance/minutes this mockup is built around. Every frame
 * below makes that SAME live fetch; nothing here is a hardcoded fallback number.
 */
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { SalonDetail } from "@/app/[locale]/_components/salon/_shared";
import { SalonLocation } from "@/app/[locale]/_components/salon/SalonLocation";

// Fixture — a fictional Basel barbershop placed right by the real Spalentor tram stop
// (see file header). Not a real business record; built only to exercise the real
// SalonDetail type + render the real component with a real transit-API response.
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

export default function PdpTransitChipMockup() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[430px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">
          Mockup — PDP map card, transit chip, 3 directions
        </p>
        <h1 className="mt-1 font-heading text-[20px] font-bold text-s-ink">
          The real SalonLocation transit chip, 3 treatments
        </h1>
        <p className="mt-1.5 text-[13.5px] leading-snug text-s-ink-2">
          Every frame below renders the actual shipping{" "}
          <code className="rounded bg-white px-1 py-0.5 text-[12px]">SalonLocation</code> component in its
          shipping <code className="rounded bg-white px-1 py-0.5 text-[12px]">card-overlay</code> variant, with a
          different <code className="rounded bg-white px-1 py-0.5 text-[12px]">transitChipVariant</code> prop.
          Fixture: Barbershop Spalentor, Basel — the transit data (Spalentor · Tram · 189 m · 2 Min) comes from a
          real, live call to <code className="rounded bg-white px-1 py-0.5 text-[12px]">/api/transit/nearest-stop</code>.
        </p>

        <div className="mt-3 rounded-2xl border border-s-border bg-white p-3.5 text-[12.5px] leading-snug text-s-ink-2">
          <span className="font-semibold text-s-ink">Owner critique fixed in all 3: </span>
          city name stripped ("Spalentor", not "Basel, Spalentor"), no trailing period ("2 Min"), a clearly
          identifiable transit icon, and alignment corrected against the salon name + address block on the left.
          Kept, per the owner: an icon with the minutes underneath/beside it in blue, and the tram/train icon
          concept.
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[430px] flex-col gap-10">
        <PhoneFrame
          label="Direction A — Stacked badge"
          rationale='A larger icon inside a sunken circle badge (legible at a glance, unlike the old bare 16px glyph), minutes directly underneath in blue, stop name beneath that in ink — one tidy, center-aligned column.'
        >
          <SalonLocation salon={SALON} variant="card-overlay" transitChipVariant="stacked-badge" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction B — Inline pill"
          rationale="A sunken pill holds the icon + stop name; the blue minutes sit as a separate element to its right. The whole block bottom-aligns with the address row instead of centering against the full two-line name+address block."
        >
          <SalonLocation salon={SALON} variant="card-overlay" transitChipVariant="inline-pill" />
        </PhoneFrame>

        <PhoneFrame
          label="Direction C — Labelled"
          rationale='Icon + the transit TYPE word ("Tram") as a tiny uppercase eyebrow, stop name under it, minutes in blue under that — answers "what is this" twice over (glyph + word), solving the identifiability complaint most explicitly.'
        >
          <SalonLocation salon={SALON} variant="card-overlay" transitChipVariant="labelled" />
        </PhoneFrame>
      </div>
    </main>
  );
}
