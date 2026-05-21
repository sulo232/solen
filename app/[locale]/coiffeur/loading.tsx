import Skeleton from "@/components-legacy/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero banner */}
      <Skeleton className="w-full h-48 rounded-[12px] mb-6" />
      {/* Salon card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}
