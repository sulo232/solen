"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { DiscoveryItem } from "@/lib/types";
import MasonryGrid from "./MasonryGrid";
import ItemCard from "./ItemCard";
import VideoCard from "./VideoCard";

interface SimilarStylesProps {
  itemId: string;
  category: string;
  tags: string[];
  isAuthenticated?: boolean;
}

const HEADING: Record<string, string> = {
  de: "Das könnte dir auch gefallen",
  en: "You might also like",
  fr: "Vous pourriez aussi aimer",
  it: "Potrebbe piacerti anche",
};

export default function SimilarStyles({ itemId, category, tags, isAuthenticated = false }: SimilarStylesProps) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;
    const fetchSimilar = async () => {
      try {
        const res = await fetch(`/api/discovery/similar?item_id=${itemId}&limit=12`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setItems(data.items ?? []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchSimilar();
    return () => { cancelled = true; };
  }, [itemId]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="mt-6 px-1">
      <h3 className="text-sm font-medium text-s-ink mb-3">
        {HEADING[locale] ?? HEADING.en}
      </h3>

      {/* V3-D346 (2026-05-29, Move 2): rail → continuing masonry, reusing feed MasonryGrid + ItemCard/VideoCard. */}
      {loading ? (
        <div className="columns-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="mb-3 rounded-2xl bg-s-ink/5 shimmer break-inside-avoid"
              style={{ height: 150 + (i % 3) * 56 }}
            />
          ))}
        </div>
      ) : (
        <MasonryGrid
          items={items}
          renderItem={(item) =>
            item.media_type === "tiktok" ? (
              <VideoCard
                item={item}
                onClick={() => router.push(`/${locale}/inspo/${item.id}`)}
                isAuthenticated={isAuthenticated}
              />
            ) : (
              <ItemCard
                item={item}
                onClick={() => router.push(`/${locale}/inspo/${item.id}`)}
                isAuthenticated={isAuthenticated}
              />
            )
          }
        />
      )}
    </div>
  );
}
