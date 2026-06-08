import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

/**
 * SkeletonCard — composite loading placeholder for a SalonCard-shaped tile.
 *
 * Server component (no `"use client"`). Built entirely from the canonical
 * `<Skeleton>` primitive (SOURCE.md §10.1) so the shimmer gradient + reduced-motion
 * handling stay token-aligned. Reproduces the composite that the deleted
 * `components-legacy/ui/Skeleton.tsx` rendered for `variant="card"`:
 *
 *   - 1:1 square photo placeholder (square corners, clipped by the rounded card)
 *   - title line  (h-4, ~75% width)
 *   - subtitle line (h-3, ~50% width)
 *   - two pill chips (h-5, w-16 + w-12, fully rounded)
 *
 * @example a grid of loading cards
 *   {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
 */

export interface SkeletonCardProps {
  /** Extra classes on the outer card wrapper (e.g. grid sizing, max-width). */
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-[20px] border border-s-border",
        className,
      )}
    >
      {/* Photo placeholder — matches SalonCard 1:1 square. */}
      <Skeleton aspect="square" rounded={0} />
      {/* Text + chips. */}
      <div className="space-y-3 p-4">
        <Skeleton height={16} width="75%" rounded={8} />
        <Skeleton height={12} width="50%" rounded={8} />
        <div className="flex gap-2">
          <Skeleton height={20} width={64} rounded="full" />
          <Skeleton height={20} width={48} rounded="full" />
        </div>
      </div>
    </div>
  );
}
