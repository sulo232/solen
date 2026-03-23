"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";
import NailDiscoveryFilters from "./NailDiscoveryFilters";
import NailDesignCard from "./NailDesignCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import MasonryGrid from "@/components/discovery/MasonryGrid";
import type { DiscoveryItem } from "@/lib/types";

export default function NailDiscoveryGrid() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [style, setStyle] = useState<string | null>(null);
  const [shape, setShape] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
      if (style) params.set("style", style);
      if (shape) params.set("shape", shape);
      if (material) params.set("material", material);

      const res = await fetch(`/api/discover/nails?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const newItems: DiscoveryItem[] = data.items ?? [];

      if (append) {
        setItems((prev) => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
      setHasMore(newItems.length >= 20);
    } finally {
      setLoading(false);
    }
  }, [style, shape, material]);

  // Reset on filter change
  useEffect(() => {
    setPage(1);
    fetchItems(1, false);
  }, [fetchItems]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = page + 1;
          setPage(next);
          fetchItems(next, true);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, hasMore, loading, fetchItems]);

  // Extract first matching tag for each filter category
  const extractTag = (tags: string[] | undefined, pool: string[]): string | undefined =>
    tags?.find((t) => pool.includes(t));

  const STYLE_KEYS = ["french", "chrome", "3d_art", "ombre", "marble", "minimal", "glitter", "abstract", "floral", "geometric", "bridal", "matte"];
  const SHAPE_KEYS = ["almond", "coffin", "stiletto", "oval", "square", "round", "squoval"];
  const MATERIAL_KEYS = ["gel", "acrylic", "dip_powder", "shellac", "polygel"];

  return (
    <div>
      {/* Filters */}
      <div className="mb-6">
        <NailDiscoveryFilters
          style={style}
          shape={shape}
          material={material}
          onStyleChange={setStyle}
          onShapeChange={setShape}
          onMaterialChange={setMaterial}
        />
      </div>

      {/* Grid */}
      {items.length === 0 && !loading ? (
        <EmptyState
          icon={Sparkles}
          title="Keine Nail-Designs gefunden"
          message="Versuche andere Filter oder schau später nochmal vorbei."
          illustration="no-results"
        />
      ) : (
        <MasonryGrid
          items={items}
          renderItem={(item, width) => (
            <NailDesignCard
              id={item.id}
              imageUrl={item.image_url ?? ""}
              style={extractTag(item.tags, STYLE_KEYS)}
              shape={extractTag(item.tags, SHAPE_KEYS)}
              material={extractTag(item.tags, MATERIAL_KEYS)}
              salonName={item.author_name ?? undefined}
              likeCount={item.like_count}
            />
          )}
        />
      )}

      {loading && (
        <div className="flex justify-center py-6"><Spinner /></div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
