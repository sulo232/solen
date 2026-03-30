import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <Skeleton className="h-12 w-64 mb-2 rounded-input" />
      <Skeleton className="h-6 w-96 mb-8 rounded-input" />
      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-pill flex-shrink-0" />
        ))}
      </div>
      {/* Last minute slots grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}
