"use client";

import { cn } from "@/lib/utils";

type SkeletonVariant = "card" | "text" | "avatar";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

export default function Skeleton({ variant = "text", className }: SkeletonProps) {
  const base = "animate-pulse bg-s-sand/70 rounded-card";

  if (variant === "avatar") {
    return <div className={cn(base, "w-10 h-10 rounded-full", className)} />;
  }

  if (variant === "card") {
    return (
      <div className={cn("rounded-card overflow-hidden border border-s-ink/5", className)}>
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
  return <div className={cn(base, "h-4 w-full", className)} />;
}
