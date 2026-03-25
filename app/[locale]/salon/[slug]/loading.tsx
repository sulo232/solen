export default function Loading() {
  return (
    <div className="min-h-screen bg-s-bg-base">
      {/* Gallery skeleton */}
      <div className="max-w-5xl mx-auto px-4 pt-16">
        <div className="w-full aspect-[16/7] rounded-[20px] bg-s-bg-sunken dark:bg-white/10 animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 w-48 bg-s-bg-sunken rounded-btn animate-pulse" />
            <div className="h-5 w-32 bg-s-bg-sunken rounded-btn animate-pulse" />
            <div className="h-4 w-64 bg-s-bg-sunken rounded animate-pulse" />
          </div>
          <div className="hidden lg:block">
            <div className="h-[400px] rounded-[20px] bg-s-bg-sunken animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
