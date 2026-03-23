"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { DiscoveryItem } from "@/lib/types";

// ── Column config ──────────────────────────────────────────────────
const GUTTER = 12;
const MIN_COLS = 2;
const MAX_COLS = 4;

function getColumnCount(containerWidth: number): number {
  if (containerWidth < 640) return 2;
  if (containerWidth < 1024) return 3;
  return 4;
}

// ── Height estimation ──────────────────────────────────────────────
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 450;

/** Calculate card height from known aspect ratios. No bottom info section → height = image area only. */
function estimateItemHeight(item: DiscoveryItem, columnWidth: number): number {
  const isTikTok =
    item.media_type === "tiktok" || !!item.tiktok_url || !!item.tiktok_embed_html;

  // aspect ratio as height/width
  const ratio = isTikTok ? 16 / 9 : 4 / 3;
  const raw = columnWidth * ratio;
  return Math.min(Math.max(raw, MIN_HEIGHT), MAX_HEIGHT);
}

// ── Position types ─────────────────────────────────────────────────
interface ItemPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

// ── Shortest-column-first placement ────────────────────────────────
function computeLayout(
  items: DiscoveryItem[],
  columnCount: number,
  containerWidth: number
): { positions: ItemPosition[]; totalHeight: number } {
  const colWidth =
    (containerWidth - GUTTER * (columnCount - 1)) / columnCount;
  const colHeights = new Array(columnCount).fill(0);
  const positions: ItemPosition[] = [];

  for (const item of items) {
    // Find shortest column (leftmost on tie)
    let shortest = 0;
    for (let c = 1; c < columnCount; c++) {
      if (colHeights[c] < colHeights[shortest]) shortest = c;
    }

    const left = shortest * (colWidth + GUTTER);
    const top = colHeights[shortest];
    const height = estimateItemHeight(item, colWidth);

    positions.push({ top, left, width: colWidth, height });
    colHeights[shortest] = top + height + GUTTER;
  }

  return {
    positions,
    totalHeight: Math.max(...colHeights, 0),
  };
}

// ── Component ──────────────────────────────────────────────────────
interface MasonryGridProps {
  items: DiscoveryItem[];
  renderItem: (item: DiscoveryItem, width: number) => ReactNode;
}

export default function MasonryGrid({ items, renderItem }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ── Measure container width ──────────────────────────────────────
  const measure = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  // Initial measure + resize listener
  useEffect(() => {
    measure();

    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [measure]);

  // ── Compute layout ───────────────────────────────────────────────
  const columnCount = containerWidth > 0 ? getColumnCount(containerWidth) : MIN_COLS;
  const { positions, totalHeight } =
    containerWidth > 0
      ? computeLayout(items, columnCount, containerWidth)
      : { positions: [], totalHeight: 0 };

  const colWidth =
    containerWidth > 0
      ? (containerWidth - GUTTER * (columnCount - 1)) / columnCount
      : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: totalHeight > 0 ? totalHeight : undefined }}
    >
      {positions.map((pos, idx) => {
        const item = items[idx];
        if (!item) return null;

        return (
          <div
            key={item.id}
            className="absolute animate-in fade-in slide-in-from-bottom-2"
            style={{
              top: 0,
              left: 0,
              transform: `translateX(${pos.left}px) translateY(${pos.top}px)`,
              width: pos.width,
              height: pos.height,
              animationDelay: `${(idx % (columnCount * 3)) * 50}ms`,
              animationFillMode: "both",
            }}
          >
            {renderItem(item, colWidth)}
          </div>
        );
      })}
    </div>
  );
}
