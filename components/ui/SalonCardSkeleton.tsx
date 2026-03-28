export default function SalonCardSkeleton() {
  return (
    <div className="card-v4 overflow-hidden animate-pulse">
      <div className="aspect-[3/2] bg-s-bg-sunken rounded-t-card" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-s-bg-sunken rounded-full w-3/4" />
        <div className="h-3 bg-s-bg-sunken rounded-full w-1/2" />
        <div className="flex gap-2">
          <div className="h-3 bg-s-bg-sunken rounded-full w-12" />
          <div className="h-3 bg-s-bg-sunken rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
