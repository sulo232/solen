"use client";

// exists-check: `npm run exists "scroll motion condensing top bar frosted"` (2026-07-25), 0
// matches , net-new. Reuses the REAL `SalonHeader` (title block: h1 name + rating + status +
// address, unmodified, same props `app/[locale]/salon/[slug]/page.tsx` passes it) rather than
// re-deriving a title block. Does NOT render the real `SalonHero` (would duplicate the back/share/
// heart icon row this file's own CondenseBar already renders as the persistent top chrome , see
// CondenseBar.tsx's doc-comment) or the real `SalonStickyTabNav` (that IS the production bar this
// route exists to propose an alternative to, so it is deliberately never mounted here). The
// "hide the real app-shell `<header>`" technique below is copied from the one other /dev route that
// needed it, `app/[locale]/dev/search-morph/page.tsx` line ~105.

import * as React from "react";
import Image from "next/image";
import { SalonHeader } from "@/app/[locale]/_components/salon/SalonHeader";
import type { SalonDetail, OpenStatus } from "@/app/[locale]/_components/salon/_shared";
import { CondenseBar, type BarVariant } from "./CondenseBar";
import { ContentSections } from "./ContentSections";
import { useHeroProgress } from "./useHeroProgress";

// Must match BAR_HEIGHT in useHeroProgress.ts (Tailwind arbitrary values need a literal in
// source, not an interpolated constant, so it's restated here rather than templated in).
const BAR_HEIGHT_PX = "56px";

export function ScrollMotionDemo({
  variant,
  salon,
  openStatus,
  locale,
}: {
  variant: BarVariant;
  salon: SalonDetail;
  openStatus: OpenStatus;
  locale: string;
}) {
  const heroRef = React.useRef<HTMLDivElement>(null);
  const progress = useHeroProgress(heroRef);
  const [backdropSupported, setBackdropSupported] = React.useState(true);

  // Hide the /dev app-shell's own global site header so this route's CondenseBar is the only
  // top chrome on screen (matches dev/search-morph's own technique for the same reason).
  React.useEffect(() => {
    const h = document.querySelector("header");
    if (!h) return;
    const prev = h.style.display;
    h.style.display = "none";
    return () => {
      if (document.contains(h)) h.style.display = prev;
    };
  }, []);

  // Solid-colour fallback feature-detection for backdrop-filter (task brief requirement).
  React.useEffect(() => {
    const supported =
      typeof CSS !== "undefined" &&
      (CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)"));
    setBackdropSupported(supported);
  }, []);

  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  return (
    <div className="pt-[calc(56px+env(safe-area-inset-top))]">
      <CondenseBar
        variant={variant}
        salon={salon}
        locale={locale}
        progress={progress}
        backdropSupported={backdropSupported}
      />

      <div ref={heroRef} className="relative aspect-[4/3] w-full bg-s-bg-sunken" style={{ minHeight: BAR_HEIGHT_PX }}>
        {photos.length > 0 ? (
          <Image src={photos[0]} alt={salon.name} fill sizes="100vw" className="object-cover" priority />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="font-display text-[96px] font-black text-s-ink-disabled">
              {salon.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pt-5">
        <SalonHeader salon={salon} openStatus={openStatus} />
      </div>

      <ContentSections salon={salon} locale={locale} />
    </div>
  );
}
