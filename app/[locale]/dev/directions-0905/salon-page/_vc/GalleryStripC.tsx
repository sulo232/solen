"use client";

// Grounded-in: app/[locale]/_components/salon/SalonHero.tsx (real salon-page gallery
// component this replaces for Direction C), app/[locale]/_components/salon/SalonPortfolio.tsx
// (frost-glass count-pill treatment reused below).
//
// exists-check: net-new vs SalonHero.tsx (the real page's single-photo swipe carousel,
// mobile) and SalonPortfolio.tsx (the 3x3 square grid further down the page). Neither
// renders a COMPACT one-row strip (several photos partially visible at once, fixed height
// instead of the hero's full-viewport-width aspect ratio), which is this direction's one
// idea. Grounded in existing patterns rather than invented: tile radius and the
// frost-glass count pill are copied treatments, not new geometry.
//
// Depicts: gallery strip tile mechanics -> SalonHero.tsx mobile carousel (aspect-[4/3] tiles, snap-x snap-mandatory, next/image fill + priority on tile 0), same mechanics at a fixed height instead of full width.
// Depicts: photo-count pill -> SalonPortfolio.tsx UniformGrid's "+N" overlay (same FROST_GLASS token, frost pill bottom-right of a photo).
// Depicts: no-photo fallback -> SalonHero.tsx's own zero-photos placeholder (bg-s-bg-sunken + salon-initial pattern, smaller type size for this shorter strip).
//
// Direction: replaces the hero so SalonHeader + Services sit one short scroll higher
// (Direction C, "book-first").

import * as React from "react";
import Image from "next/image";
import { FROST_GLASS } from "@/lib/frost-glass";

// Height chosen to land close to the FLOORS LAW imagery floor ("~1/3 of a 390x844
// viewport, roughly") while still reading as compact next to the real hero's aspect-[4/3]
// frame (≈292px at 390 width): 260px = 30.8% of 844, ≈2.5pp under the ~1/3 reference
// rather than the ~34.6% the current hero already clears. This is the direct cost of
// "compact": logged in the mockup return under floors/concerns, not hidden.
const STRIP_HEIGHT = 260;

export function GalleryStripC({ photos, salonName }: { photos: string[]; salonName: string }) {
  if (photos.length === 0) {
    return (
      <div
        className="grid w-full place-items-center bg-s-bg-sunken"
        style={{ height: STRIP_HEIGHT }}
      >
        <span className="font-display text-[64px] font-bold text-s-ink-disabled">
          {salonName.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: STRIP_HEIGHT }}>
      <div className="flex h-full w-full snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((u, i) => (
          <div
            key={u + i}
            className="relative h-full shrink-0 snap-center bg-s-bg-sunken"
            // 4:3 tile at a fixed height reads as "peek of the next photo" at 390 width
            // (one tile ≈89% of the viewport), the density-floor "scroll promise" a single
            // full-width photo carousel doesn't give (it shows exactly one at a time;
            // this shows the current one plus a sliver of the next).
            style={{ width: STRIP_HEIGHT * (4 / 3) }}
          >
            <Image
              src={u}
              alt={`${salonName}, photo ${i + 1} of ${photos.length}`}
              fill
              sizes="347px"
              className="object-cover"
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <span
          aria-hidden
          style={FROST_GLASS}
          className="absolute bottom-3 right-3 rounded-full px-2.5 py-1 font-body text-[12px] font-semibold tabular-nums text-s-ink"
        >
          {photos.length} photos
        </span>
      )}
    </div>
  );
}
