"use client";

import { cn } from "@/lib/utils";

type SkeletonVariant = "card" | "text" | "avatar";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ variant = "text", className, style }: SkeletonProps) {
  const base = "animate-shimmer rounded-[8px] bg-gradient-to-r from-s-bg-surface via-s-bg-sunken to-s-bg-surface bg-[length:200%_100%] dark:from-s-dm-surface dark:via-s-dm-sunken dark:to-s-dm-surface";

  if (variant === "avatar") {
    return <div className={cn(base, "w-10 h-10 rounded-full", className)} style={style} />;
  }

  if (variant === "card") {
    return (
      <div className={cn("rounded-[20px] overflow-hidden border border-s-ink/5", className)} style={style}>
        {/* Photo placeholder — matches SalonCard aspect-[4/5] */}
        <div className={cn(base, "w-full aspect-[4/5] rounded-none")} />
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
