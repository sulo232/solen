// mockup-ok: mirrors the real app/[locale]/_components/profile/ProfileTabs.tsx render
// 1:1 (Pinterest-profile rebuild, 2026-07-21, public/_mockups/pinterest-ref-solen/index.html):
// identity row, underline tab row, search rect, Sortieren pill, 2-col collage grid (the
// default "Gespeichert" tab). Was previously skeletoning the pre-rebuild hero+grid shape,
// which flashed the wrong layout while page.tsx's Supabase queries resolve.
import { Skeleton } from "@/app/[locale]/_components/primitives";

export default function Loading() {
  return (
    <div className="max-w-[560px] mx-auto px-4 pb-16">
      {/* Identity anchor row: 48px avatar, 28px name bar, 44px gear square */}
      <div className="flex items-center gap-3.5 pt-[18px]">
        <Skeleton width={48} height={48} rounded="full" className="shrink-0" />
        <Skeleton width={120} height={24} rounded={4} className="flex-1" />
        <Skeleton width={44} height={44} rounded={12} className="shrink-0" />
      </div>

      {/* Tab row: two 18px label bars, centered, hairline below */}
      <div className="mt-3 flex items-center justify-center gap-6">
        <Skeleton width={84} height={18} rounded={4} />
        <Skeleton width={64} height={18} rounded={4} />
      </div>
      <div className="mt-2.5 border-b border-s-border" />

      {/* Search rect: full-width, 44px, radius 12 */}
      <Skeleton height={44} rounded={12} className="mt-4" />

      {/* Sortieren pill */}
      <Skeleton width={120} height={44} rounded="full" className="mt-4" />

      {/* 2-col collage grid: 4 tiles at the aspect-[195/131] ratio, name + city under each */}
      <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton rounded={16} className="aspect-[195/131] w-full" />
            <Skeleton height={16} width="70%" rounded={4} className="mt-2" />
            <Skeleton height={12} width="45%" rounded={4} className="mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
