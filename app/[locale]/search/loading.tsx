import { Skeleton, SkeletonCard } from "@/app/[locale]/_components/primitives";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search bar */}
      <Skeleton className="h-12 w-full mb-6" rounded={99} />
      {/* Result card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
