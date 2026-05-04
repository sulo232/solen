import Skeleton from "@/components-legacy/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-pill flex-shrink-0" />
        ))}
      </div>
      {/* Filter bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-pill flex-shrink-0" />
        ))}
      </div>
      {/* Masonry grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className={`rounded-[20px] ${i % 3 === 0 ? "h-64" : i % 3 === 1 ? "h-80" : "h-72"}`} />
        ))}
      </div>
    </div>
  );
}
