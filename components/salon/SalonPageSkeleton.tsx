import Skeleton from "@/components/ui/Skeleton";

export default function SalonPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Hero gallery skeleton */}
      <Skeleton className="w-full aspect-[16/7] rounded-card-lg mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Title + meta */}
          <div className="space-y-3">
            <Skeleton className="h-9 w-2/3 rounded-input" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-btn" />
              <Skeleton className="h-5 w-24 rounded-btn" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>

          {/* Tab nav skeleton */}
          <div className="flex gap-4 border-b border-s-ink/[0.06] pb-0">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-16 rounded" />
            ))}
          </div>

          {/* Content sections */}
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>

        {/* Right: sidebar skeleton (desktop only) */}
        <div className="hidden lg:block">
          <Skeleton className="h-72 rounded-card sticky top-24" />
        </div>
      </div>
    </div>
  );
}
