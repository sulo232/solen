// H1 "Contained hero card" , exists-check: net-new /dev preview (`npm run exists "home imagery"` = 0
// hits). One large inset, radius'd photo CARD (page margins respected, rounded-card-lg per LOCKFILE's
// own "Hero cards, feature cards, modals" token) carries the headline; the real search card sits below
// it. Contained per the owner's 2026-07-16 full-bleed denial (REMOVED.md "FB1 home photo hero
// (straddling search)"): the photo never touches or straddles the search card, it lives fully inside
// its own rounded card, inset by the same px-4 page margin Hero.tsx uses today.

import Image from "next/image";
import { DevHeaderPlaceholder, HeroHeading, SearchCardStatic, type DevSalon } from "./shared";

export function H1ContainedHero({ photo }: { photo: DevSalon }) {
  return (
    <div className="flex flex-col bg-white">
      <DevHeaderPlaceholder />
      <div className="flex flex-col px-4 pt-5 pb-5">
        <div className="relative h-[440px] w-full overflow-hidden rounded-card-lg shadow-elevation-2">
          <Image
            src={photo.photoUrl}
            alt={`Photo of ${photo.name}`}
            fill
            priority
            sizes="358px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <HeroHeading tone="white" />
          </div>
        </div>
        <div className="mt-4">
          <SearchCardStatic />
        </div>
      </div>
    </div>
  );
}
