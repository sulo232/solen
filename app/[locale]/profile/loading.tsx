// exists-check: net-new content vs the file it replaces (this loading.tsx already exists,
// this is a rewrite in place, not a new file). Shape mirrors the real
// app/[locale]/_components/profile/ProfileTabs.tsx render 1:1 (D1 rebuild, 2026-07-20/21):
// tab bar, search rect, hero card, 2-col tile grid. Was previously skeletoning the OLD
// row-list hub (pre-rebuild shape), which flashed the wrong layout while page.tsx's 5
// Supabase queries resolve.
//
// mockup-ok: every dimension below (40px avatar circle, 44px gear square, 46px/16px-radius
// search rect, 52x64 date chip, 4/3 rounded-16 tiles, the 560px container) is a mechanical
// 1:1 mirror of the already owner-approved D1 shape in ProfileTabs.tsx (itself grounded in
// public/_mockups/sweep-profile-pinterest/index.html), not a new design decision.
import { Skeleton } from "@/app/[locale]/_components/primitives";

export default function Loading() {
  return (
    <div className="max-w-[560px] mx-auto px-4 pt-4 pb-16">
      {/* Tab bar: 40px avatar circle, three tab-label bars, one 44px gear square */}
      <div className="flex items-center gap-2">
        <Skeleton width={40} height={40} rounded="full" className="shrink-0" />
        <div className="flex flex-1 items-center justify-center gap-[22px]">
          <Skeleton width={72} height={15} rounded={4} />
          <Skeleton width={54} height={15} rounded={4} />
          <Skeleton width={44} height={15} rounded={4} />
        </div>
        <Skeleton width={44} height={44} rounded={12} className="shrink-0" />
      </div>

      {/* Search rect: full-width, 46px, rounded-16 */}
      <Skeleton height={46} rounded={16} className="mt-3" />

      {/* Hero card: date block plus stacked lines, kept simple */}
      <div className="mt-4">
        <Skeleton width={100} height={13} rounded={4} className="mb-2.5" />
        <div className="rounded-card border border-s-border p-4">
          <div className="flex items-start gap-3">
            <Skeleton width={52} height={64} rounded={12} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <Skeleton height={16} width="70%" rounded={4} />
              <Skeleton height={13} width="50%" rounded={4} className="mt-2" />
              <Skeleton height={13} width="40%" rounded={4} className="mt-1.5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-s-border pt-3">
            <Skeleton height={15} width={80} rounded={4} />
            <Skeleton height={15} width={60} rounded={4} />
          </div>
        </div>
      </div>

      {/* 2-col tile grid: 4 tiles, each a 4/3 photo block plus name plus meta line */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton rounded={16} className="aspect-[4/3] w-full" />
            <Skeleton height={14} width="70%" rounded={4} className="mt-2" />
            <Skeleton height={12} width="45%" rounded={4} className="mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
