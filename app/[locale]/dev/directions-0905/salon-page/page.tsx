// Exists-check: `npm run exists directions-0905` -> DirectionFrame (reused, not forked).
// `npm run exists "salon page"` -> app/[locale]/salon/[slug]/page.tsx (the real route this
// mockup copies) + app/[locale]/_components/salon/SalonDetailV3.tsx (the real orchestrator).
// This file is the shared `?v=` switch for the three directions of THIS surface
// (salon-page), per the brief: "shared by the three directions of this surface... add
// ONLY your branch for v=b". Direction B (Photo-led) is filled below; A and C render a
// plain placeholder until their own builders fill `_va/` / `_vc/`.
//
// Grounded-in: app/[locale]/salon/[slug]/page.tsx (the real server loader + route this
// file mirrors: loadSalonDetailWithStatus for the real muse-beauty-studio salon).
//
// Depicts: real salon data load -> app/[locale]/salon/[slug]/page.tsx (same loader call)
// Depicts: direction-comparison strip + variant switcher -> app/[locale]/dev/directions-0905/_shared/DirectionFrame.tsx

import { DirectionFrame } from "@/app/[locale]/dev/directions-0905/_shared/DirectionFrame";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonPageAirbnbLook } from "./_vb/SalonPageAirbnbLook";
import { SalonPageDirectionA } from "./_va/SalonPageDirectionA";
import { DirectionC } from "./_vc/DirectionC";

const SALON_SLUG = "muse-beauty-studio";

const DIRECTIONS = [
  { value: "a", label: "Fresha order" },
  { value: "b", label: "Airbnb look, full strength (locks broken on purpose)" },
  { value: "c", label: "Book-first: compact gallery, services lead, sticky bar tracks the pick" },
];

export default async function SalonPageDirections({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const v: "a" | "b" | "c" = sp.v === "b" ? "b" : sp.v === "c" ? "c" : "a";

  const result = await loadSalonDetailWithStatus(SALON_SLUG, locale);

  if (!result) {
    return (
      <DirectionFrame surface="salon-page" directions={DIRECTIONS} active={v}>
        <div className="p-6 text-[14px] text-s-ink-2">
          Blocked: loadSalonDetailWithStatus(&quot;{SALON_SLUG}&quot;) returned null, the real
          salon row this mockup needs could not be loaded.
        </div>
      </DirectionFrame>
    );
  }

  const { salon, openStatus, todayKey } = result;

  return (
    <DirectionFrame surface="salon-page" directions={DIRECTIONS} active={v}>
      {v === "a" && (
        <SalonPageDirectionA salon={salon} openStatus={openStatus} todayKey={todayKey} locale={locale} slug={SALON_SLUG} />
      )}
      {v === "b" && (
        <SalonPageAirbnbLook salon={salon} openStatus={openStatus} todayKey={todayKey} locale={locale} />
      )}
      {v === "c" && (
        <DirectionC salon={salon} openStatus={openStatus} todayKey={todayKey} locale={locale} />
      )}
    </DirectionFrame>
  );
}
