"use client";

// H3 "Salon-first" , exists-check: net-new /dev preview (`npm run exists "home imagery"` = 0 hits).
// Skips the abstract hero entirely: the first viewport IS a real salon card (SalonCard.tsx, the exact
// component the real homepage feed renders, reused via its own widthClassName override, not a
// lookalike redraw) at full width minus page margins, with the search collapsed to a single compact
// pill above it. "use client" because SalonCard.tsx calls next-intl's useLocale(), which needs a client
// boundary , matches how the real callers (ForYouSalonRows.tsx, Nearby.tsx) are themselves "use client".

import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import { CompactSearchPill, DevHeaderPlaceholder, type DevSalon } from "./shared";

export function H3SalonFirst({ salons }: { salons: DevSalon[] }) {
  return (
    <div className="flex flex-col bg-white">
      <DevHeaderPlaceholder />
      <div className="flex flex-col gap-3 px-4 pt-5">
        <CompactSearchPill />
        {salons.map((s, i) => (
          <SalonCard
            key={`${s.slug}-${i}`}
            slug={s.slug}
            salonId={s.salonId}
            name={s.name}
            rating={s.rating}
            reviewCount={s.reviewCount ?? undefined}
            photoUrl={s.photoUrl}
            category={s.category}
            variant="service"
            priceFromCHF={s.priceFromCHF}
            postalCode={s.postalCode ?? undefined}
            city={s.city ?? undefined}
            widthClassName="w-full"
          />
        ))}
      </div>
    </div>
  );
}
