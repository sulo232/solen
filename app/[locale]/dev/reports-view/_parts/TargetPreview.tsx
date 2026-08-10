"use client";

// exists-check: net-new vs lib/category-photos.ts, hooks/useSalonProfile.ts,
// lib/verify-salon-client.ts, app/api/admin/preview-salon/route.ts,
// lib/gdpr/purge-client-photo-storage.ts, lib/gdpr/purge-review-photo-storage.ts,
// supabase/migrations/004_salon_photos.sql, components-legacy/salon/SalonReviews.tsx , the
// exists-guard's fuzzy "preview"/"review"/"salon" hits. None of those render a REPORTED item
// (review/salon/user) as a read-only moderation preview: SalonReviews.tsx is the live customer
// review list, useSalonProfile/verify-salon-client/preview-salon are data-fetch/verification
// utilities, category-photos/salon_photos/gdpr-purge are storage plumbing. This component is
// pure presentation over already-loaded sample data, scoped to app/[locale]/dev/reports-view/
// per the task's scope fence, so it does not belong inside any of those.
//
// The reported content "as the customer sees it" (R2/R3 brief requirement), branched on
// target.type. This is content-shape polymorphism (a review looks structurally nothing like a
// salon profile or a user bio), not the banned category-styling fork (COMPONENT_REGISTRY B5,
// "no if category === X branches") which targets business-category-driven STYLING, not
// rendering three genuinely different data shapes.

import * as React from "react";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { RatingStars } from "@/app/[locale]/_components/primitives/RatingStars";
import type { TargetContent } from "./data";

export function TargetPreview({ target, className }: { target: TargetContent; className?: string }) {
  return (
    <div className={cn("rounded-card border border-s-border bg-white p-4", className)}>
      {target.type === "review" && (
        <>
          <div className="flex items-center gap-3">
            <Avatar name={target.reviewAuthor ?? "?"} size="xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-s-ink">{target.reviewAuthor}</p>
              <p className="truncate text-[12px] text-s-ink-2">on {target.salonName}</p>
            </div>
            {target.reviewRating != null && (
              <RatingStars mode="five" value={target.reviewRating} size="sm" className="shrink-0" />
            )}
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-s-ink">{target.reviewText}</p>
          {target.reviewHasPhoto && <p className="mt-2 text-[12px] text-s-ink-2">Includes 1 photo</p>}
        </>
      )}

      {target.type === "salon" && (
        <>
          <div className="flex items-center gap-3">
            {/* No real photo asset for a fictional sample salon: the spec'd fallback
               (sunken bg + category icon), not a bare grey box. */}
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-s-bg-sunken text-s-ink-2">
              <Store size={20} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-s-ink">{target.salonName}</p>
              <p className="truncate text-[12px] text-s-ink-2">{target.salonCategory}</p>
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-s-ink">{target.salonBio}</p>
        </>
      )}

      {target.type === "user" && (
        <>
          <div className="flex items-center gap-3">
            <Avatar name={target.userDisplayName ?? "?"} size="xs" />
            <p className="truncate text-[14px] font-semibold text-s-ink">{target.userDisplayName}</p>
          </div>
          <p className={cn("mt-3 text-[14px] leading-relaxed", target.userBio ? "text-s-ink" : "text-s-ink-2")}>
            {target.userBio || "No bio."}
          </p>
        </>
      )}

      <p className="mt-3 font-mono-code text-[12px] text-s-ink-2">{target.refCode}</p>
    </div>
  );
}
