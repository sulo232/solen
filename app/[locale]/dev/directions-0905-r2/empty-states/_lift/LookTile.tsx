"use client";

// Exists-check: `npm run exists ItemCard` -> components-legacy/discovery/ItemCard.tsx, the real
// registered Inspo tile. Not composed directly here, same reasoning round-1's _vc/DirectionC.tsx
// already recorded (own header comment, "Depicts: looks grid"): ItemCard's own heart posts to a
// real save endpoint, and this tile sits in a "browse Inspo" rail with no working save context,
// so a save control here would be a dead affordance (taste rule / dead-click contract). This
// tile reuses ItemCard's own displayImage RESOLUTION LOGIC (tiktok source -> the refresh-proxy
// route, else the stored image/thumbnail, already applied upstream in loadDirectionC.ts's
// loadNewestLooks) but draws its own non-interactive presentational shell, built from the kit's
// registered Card primitive (FLOORS LAW 9) instead of round-1's raw `rounded-2xl` div, so the
// tile carries this system's real shadow/border delta instead of a hand-rolled corner.
//
// Grounded-in: app/[locale]/dev/directions-0905/empty-states/_vc/DirectionC.tsx (the looks-grid
// JSX this tile's aspect ratio and layout are ported from, 3:4, 2-column) and
// app/[locale]/dev/directions-0905-r2/_kit/Card.tsx (variant="photo": shadow-whisper, no
// border, radius 16 under LIFT -- the system this rail actually belongs to).
//
// system: LIFT via Card's own useSystem() read; this file passes no system prop itself.

import * as React from "react";
import Image from "next/image";
import { Card, Meta } from "../../_kit";

export interface LookTileProps {
  displayImage: string | null;
  alt: string;
  styleName: string | null;
}

export function LookTile({ displayImage, alt, styleName }: LookTileProps) {
  return (
    <div>
      <Card variant="photo" className="relative aspect-[3/4]">
        {displayImage && (
          <Image src={displayImage} alt={alt} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
        )}
      </Card>
      {styleName && (
        <div className="mt-1.5 truncate">
          <Meta>{styleName}</Meta>
        </div>
      )}
    </div>
  );
}
