// exists-check: net-new. `npm run exists reviews-sort` (2026-07-24) = 0 hits; the only existing
// sort surfaces are TabPill-chip rows (ReviewsFullFilterList's old "Sort by" chips, replaced by
// this sheet per the owner's Fresha "sort bottom sheet" reference) , no shipped bottom-sheet sort
// control for reviews anywhere in the repo. Built on the canonical `Sheet`/`SheetHeader`/
// `SheetBody` primitives (app/[locale]/_components/primitives/Sheet.tsx, imported not edited).
// The radio row itself is NOT the shared `Radio` primitive: the owner explicitly asked for the
// selected state to use OUR blue `s-accent` here ("the reference uses purple, use our blue"),
// which is a one-off deviation from Radio's default ink-fill grammar, so changing the shared
// primitive would leak blue into every other radio row in the app. Structure (hairline-separated
// 44px+ rows) is still grounded in Radio's row grammar, just re-implemented with the accent color.
"use client";

import * as React from "react";
import { Sheet, SheetHeader, SheetBody } from "@/app/[locale]/_components/primitives";
import { cn } from "@/lib/utils";

export type ReviewSortKey = "latest" | "best" | "worst";

export const REVIEW_SORT_LABEL: Record<ReviewSortKey, string> = {
  latest: "Latest",
  best: "Best",
  worst: "Worst",
};

const SORT_ROWS: ReviewSortKey[] = ["latest", "best", "worst"];

export function ReviewsSortSheet({
  open,
  onOpenChange,
  sort,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: ReviewSortKey;
  onSelect: (sort: ReviewSortKey) => void;
}) {
  return (
    <Sheet isOpen={open} onOpenChange={onOpenChange} height="auto" aria-label="Sort reviews">
      <SheetHeader title="Sort by" closeAriaLabel="Close" onClose={() => onOpenChange(false)} />
      <SheetBody className="pb-6">
        {SORT_ROWS.map((key) => {
          const selected = sort === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                onSelect(key);
                onOpenChange(false);
              }}
              className="flex min-h-11 w-full items-center gap-3 border-b border-s-border py-[14px] text-left last:border-b-0"
            >
              <span
                aria-hidden
                className={cn(
                  "inline-block h-[18px] w-[18px] shrink-0 rounded-full", // selected-ok: task brief verbatim, owner said use our blue accent here (same exception class as the booking date/time slot)
                  selected ? "bg-s-accent" : "border-2 border-s-border bg-white", // selected-ok: task brief verbatim, owner said use our blue accent here
                )}
              />
              <span className={cn("font-body text-[16px] text-s-ink", selected && "font-semibold")}>
                {REVIEW_SORT_LABEL[key]}
              </span>
            </button>
          );
        })}
      </SheetBody>
    </Sheet>
  );
}
