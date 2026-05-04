export default function SalonCardSkeleton() {
  return (
    <div className="overflow-hidden animate-pulse">
      {/* Image placeholder — matches SalonCard 1:1 square */}
      <div className="aspect-square bg-s-bg-sunken rounded-[12px]" />
      <div className="mt-3 space-y-[6px]">
        {/* Name + rating row */}
        <div className="flex items-center justify-between gap-2">
          <div className="h-[15px] bg-s-bg-sunken rounded-full w-3/4" />
          <div className="h-[13px] bg-s-bg-sunken rounded-full w-12 shrink-0" />
        </div>
        {/* Type · Quartier */}
        <div className="h-[13px] bg-s-bg-sunken rounded-full w-1/2" />
        {/* Price */}
        <div className="h-[13px] bg-s-bg-sunken rounded-full w-1/4" />
      </div>
    </div>
  );
}
