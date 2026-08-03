// mockup-ok: mirrors the real app/[locale]/_components/profile/AccountHub.tsx render 1:1
// (account-hub rebuild, 2026-08-02, public/_mockups/restraint/account-hub.html): eyebrow +
// 60px avatar + 28px name, then three row-group card skeletons (1/2/3 rows) + a settings card +
// a centered Abmelden bar. Was previously skeletoning the pre-rebuild tab bar / search field /
// Sortieren pill / 2-col collage grid, which flashed the wrong layout while page.tsx's Supabase
// queries resolve.
import { Skeleton } from "@/app/[locale]/_components/primitives";

function RowSkeleton() {
  return (
    <div className="flex items-center gap-[14px] px-4 py-[15px]">
      <Skeleton width={38} height={38} rounded={14} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <Skeleton height={15} width="50%" rounded={4} />
        <Skeleton height={12} width="70%" rounded={4} className="mt-1.5" />
      </div>
      <Skeleton width={18} height={18} rounded={4} className="shrink-0" />
    </div>
  );
}

function GroupSkeleton({ rows }: { rows: number }) {
  return (
    <div className="mt-[26px]">
      <Skeleton height={12} width={70} rounded={4} className="mb-2 ml-1" />
      <div className="bg-white">
        {Array.from({ length: rows }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-[560px] px-5 pb-16">
      {/* Header: eyebrow + 60px avatar + 28px name bar */}
      <div className="pt-[18px]">
        <Skeleton height={12} width={48} rounded={4} className="mb-3.5" />
        <div className="flex items-center gap-3.5">
          <Skeleton width={60} height={60} rounded="full" className="shrink-0" />
          <Skeleton height={28} width="55%" rounded={4} />
        </div>
      </div>

      <GroupSkeleton rows={1} />
      <GroupSkeleton rows={2} />
      <GroupSkeleton rows={3} />

      {/* Einstellungen card: no group label above it, matches the real render */}
      <div className="mt-[26px] bg-white">
        <RowSkeleton />
      </div>

      {/* Abmelden */}
      <div className="mt-[30px] flex justify-center">
        <Skeleton height={15} width={90} rounded={4} />
      </div>
    </div>
  );
}
