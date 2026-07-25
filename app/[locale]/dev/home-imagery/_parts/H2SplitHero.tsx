// H2 "Split hero" , exists-check: net-new /dev preview (`npm run exists "home imagery"` = 0 hits).
// Headline + the real search card stay on white at the top, exactly where they sit today (Hero.tsx);
// one single large CONTAINED photo (page margins respected, rounded-card) fills the rest of the first
// viewport below them. Least disruptive to the current composition , the photo earns space AFTER the
// search, never straddling it (owner's 2026-07-16 full-bleed denial, REMOVED.md "FB1 home photo hero
// (straddling search)").

import Image from "next/image";
import { DevHeaderPlaceholder, HeroHeading, SearchCardStatic, type DevSalon } from "./shared";

export function H2SplitHero({ photo }: { photo: DevSalon }) {
  return (
    <div className="flex flex-col bg-white">
      <DevHeaderPlaceholder />
      <div className="flex flex-col px-4 pt-5">
        <HeroHeading tone="ink" />
        <div className="mt-5">
          <SearchCardStatic />
        </div>
      </div>
      <div className="mt-4 px-4 pb-4">
        <div className="relative h-[375px] w-full overflow-hidden rounded-card border border-s-border">
          <Image
            src={photo.photoUrl}
            alt={`Photo of ${photo.name}`}
            fill
            priority
            sizes="358px"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
