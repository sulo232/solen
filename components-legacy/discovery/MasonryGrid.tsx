"use client";

import type { ReactNode } from "react";
import type { DiscoveryItem } from "@/lib/types";

// V3-D387 (2026-05-30): switched from JS absolute-positioning (fixed height ESTIMATE per media-type → every card the
// same 16:9 → a rigid grid, not a masonry) to CSS multi-column flow. Each card adopts its image's NATURAL aspect
// ratio (the card self-measures on load — see ItemCard/VideoCard), so heights vary like Pinterest. This also deletes
// the absolute-positioning + transform code that caused the earlier "all cards collapse to (0,0)" bug — simpler and
// structurally can't regress that way. `gap-3` = column gap, `mb-3` = vertical gap, `break-inside-avoid` keeps a card
// whole within a column.
interface MasonryGridProps {
  items: DiscoveryItem[];
  /** width arg kept for signature compatibility; CSS columns size cards via the column, so callers pass 0. */
  renderItem: (item: DiscoveryItem, width: number) => ReactNode;
}

export default function MasonryGrid({ items, renderItem }: MasonryGridProps) {
  return (
    // V3-D412 (user, "make it dense like Pinterest"): gutters tightened 12px → 6px (gap-1.5 / mb-1.5) so the
    // look-feed reads as an immersive wall instead of an airy grid. Column counts unchanged (2 mobile → 4 lg).
    <div className="columns-2 md:columns-3 lg:columns-4 gap-1.5 [column-fill:balance]">
      {items.map((item) => (
        <div key={item.id} className="mb-1.5 break-inside-avoid animate-in fade-in duration-300">
          {renderItem(item, 0)}
        </div>
      ))}
    </div>
  );
}
