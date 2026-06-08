import { Skeleton } from "@/app/[locale]/_components/primitives";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[12px] p-4 space-y-3">
            <Skeleton className="h-3 w-1/2" rounded={8} />
            <Skeleton className="h-8 w-2/3" rounded={8} />
            <Skeleton className="h-2 w-full" rounded={8} />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <Skeleton className="h-64 w-full mb-6" rounded={12} />
      {/* Table rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" rounded={12} />
        ))}
      </div>
    </div>
  );
}
