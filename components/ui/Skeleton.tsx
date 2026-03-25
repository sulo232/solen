"use client";

import { cn } from "@/lib/utils";

type SkeletonVariant = "card" | "text" | "avatar";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ variant = "text", className, style }: SkeletonProps) {
  const base = "animate-pulse rounded-[8px] bg-s-bg-sunken dark:bg-white/[0.06]";

  if (variant === "avatar") {
    return <div className={cn(base, "w-10 h-10 rounded-full", className)} style={style} />;
  }

  if (variant === "card") {
    return (
      <div className={cn("rounded-[20px] overflow-hidden border border-s-ink/5", className)} style={style}>
        {/* Photo placeholder */}
        <div className={cn(base, "h-40 w-full rounded-none")} />
        {/* Text lines */}
        <div className="p-4 space-y-3">
          <div className={cn(base, "h-4 w-3/4")} />
          <div className={cn(base, "h-3 w-1/2")} />
          <div className="flex gap-2">
            <div className={cn(base, "h-5 w-16 rounded-full")} />
            <div className={cn(base, "h-5 w-12 rounded-full")} />
          </div>
        </div>
      </div>
    );
  }

  // text variant
  return <div className={cn(base, "h-4 w-full", className)} style={style} />;
}
