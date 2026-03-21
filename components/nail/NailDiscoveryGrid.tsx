"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Heart, Bookmark } from "lucide-react";
import NailDiscoveryFilters from "./NailDiscoveryFilters";
import Spinner from "@/components/ui/Spinner";
import type { NailStyleCategory, NailShape, NailMaterial } from "@/lib/types";

interface DiscoveryItem {
  id: string;
  image_url: string;
  name_de?: string;
  name_en?: string;
  style?: NailStyleCategory | null;
  shape?: NailShape | null;
  material?: NailMaterial | null;
  salon_name?: string;
  like_count: number;
  save_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

export default function NailDiscoveryGrid() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [style, setStyle] = useState<NailStyleCategory | null>(null);
  const [shape, setShape] = useState<NailShape | null>(null);
  const [material, setMaterial] = useState<NailMaterial | null>(null);
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

  const toggleLike = async (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, is_liked: !item.is_liked, like_count: item.like_count + (item.is_liked ? -1 : 1) }
          : item
      )
    );
    await fetch("/api/discover/nails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: id, action: "like" }),
    }).catch(() => {});
  };

  const toggleSave = async (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, is_saved: !item.is_saved, save_count: item.save_count + (item.is_saved ? -1 : 1) }
          : item
      )
    );
    await fetch("/api/discover/nails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: id, action: "save" }),
    }).catch(() => {});
  };

  const BADGE_LABELS: Record<string, string> = {
    french: "French", chrome: "Chrome", "3d_art": "3D Art", ombre: "Ombré",
    marble: "Marble", glitter: "Glitter", minimal: "Minimal", abstract: "Abstract",
    gel: "Gel", acrylic: "Acryl", shellac: "Shellac",
    almond: "Mandel", coffin: "Coffin", stiletto: "Stiletto",
  };

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
        <p className="text-center text-sm text-s-ink/40 dark:text-s-dm-text/40 py-12">
          Keine Nail-Designs gefunden
        </p>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="break-inside-avoid rounded-card overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 shadow-card"
            >
              <div className="relative">
                <Image
                  src={item.image_url}
                  alt={item.name_de ?? "Nail Design"}
                  width={400}
                  height={500}
                  className="w-full h-auto"
                />
                {/* Like/Save overlay */}
                <div className="absolute bottom-2 right-2 flex gap-1.5">
                  <button
                    onClick={() => toggleLike(item.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-pill bg-white/80 dark:bg-s-dm-bg/80 backdrop-blur-sm text-xs"
                  >
                    <Heart size={12} className={item.is_liked ? "fill-s-coral text-s-coral" : "text-s-ink/40"} />
                    {item.like_count}
                  </button>
                  <button
                    onClick={() => toggleSave(item.id)}
                    className="p-1 rounded-full bg-white/80 dark:bg-s-dm-bg/80 backdrop-blur-sm"
                  >
                    <Bookmark size={14} className={item.is_saved ? "fill-s-coral text-s-coral" : "text-s-ink/40"} />
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                {item.style && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral">
                    {BADGE_LABELS[item.style] || item.style}
                  </span>
                )}
                {item.salon_name && (
                  <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-1 truncate">{item.salon_name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-6"><Spinner /></div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
