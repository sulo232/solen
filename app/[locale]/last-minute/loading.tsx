import { Skeleton, SkeletonCard } from "@/app/[locale]/_components/primitives";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <Skeleton className="h-12 w-64 mb-2" rounded={16} />
      <Skeleton className="h-6 w-96 mb-8" rounded={16} />
      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 flex-shrink-0" rounded="full" />
        ))}
      </div>
      {/* Last minute slots grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
