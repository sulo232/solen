"use client";

import { useMemo } from "react";
import type { DiscoveryItem } from "@/lib/types";
import ItemCard from "./ItemCard";
import VideoCard from "./VideoCard";

interface DiscoveryGridProps {
  items: DiscoveryItem[];
  columns?: number;
  onItemClick?: (item: DiscoveryItem) => void;
}

function distributeItems(items: DiscoveryItem[], colCount: number) {
  const columns: DiscoveryItem[][] = Array.from({ length: colCount }, () => []);
  const heights = new Array(colCount).fill(0);
  items.forEach((item) => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(item);
    heights[shortest] += item.media_type === "tiktok" ? 400 : 300;
  });
  return columns;
}

export default function DiscoveryGrid({ items, columns = 3, onItemClick }: DiscoveryGridProps) {
  const cols = useMemo(() => distributeItems(items, columns), [items, columns]);

  return (
    <div className="flex gap-3" style={{ columnCount: columns }}>
      {cols.map((col, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-3">
          {col.map((item, idx) => (
            <div
              key={item.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}
            >
              {item.media_type === "tiktok" ? (
                <VideoCard item={item} onClick={() => onItemClick?.(item)} />
              ) : (
                <ItemCard item={item} onClick={() => onItemClick?.(item)} />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
