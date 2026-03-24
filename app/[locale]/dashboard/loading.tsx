import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-s-dm-surface rounded-card p-4 space-y-3">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <Skeleton className="h-64 w-full rounded-card mb-6" />
      {/* Table rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-card" />
        ))}
      </div>
    </div>
  );
}
