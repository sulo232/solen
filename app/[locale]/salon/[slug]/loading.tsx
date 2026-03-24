import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero image */}
      <Skeleton className="w-full h-56 sm:h-72 rounded-card mb-6" />
      {/* Salon name + rating */}
      <div className="space-y-3 mb-8">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      {/* Service list */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-s-dm-surface rounded-card">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20 rounded-btn" />
          </div>
        ))}
      </div>
    </div>
  );
}
