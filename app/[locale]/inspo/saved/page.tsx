"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import MasonryGrid from "@/components-legacy/discovery/MasonryGrid";
import ItemCard from "@/components-legacy/discovery/ItemCard";
import VideoCard from "@/components-legacy/discovery/VideoCard";
import DiscoveryGridSkeleton from "@/components-legacy/discovery/DiscoveryGridSkeleton";
import type { DiscoveryItem } from "@/lib/types";
import { useTranslations } from "next-intl";

// Gespeichert: a plain, flat grid of the looks you hearted. The named-collections / boards layer was ditched
// 2026-06-23 (owner: "the heart icon just saves, simple plain") — this IS the whole saved feature now, and where
// we keep building on saves. Reached from the heart in the Inspo header. Same masonry + cards as the feed.
export default function SavedPage() {
  const tBack = useTranslations("common");
  const params = useParams<{ locale: string }>()!;
  const router = useRouter();
  const locale = params.locale;
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/discovery/saves?limit=60");
      const d = res.ok ? await res.json() : null;
      setItems(Array.isArray(d?.items) ? d.items : []);
    } catch (err) {
      console.error("[Saved] load failed:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleItemClick = (item: DiscoveryItem) => {
    if ((item.source === "salon" || item.content_type === "salon") && item.salon_slug) {
      router.push(`/${locale}/salon/${item.salon_slug}`);
      return;
    }
    router.push(`/${locale}/inspo/${item.id}`);
  };

  // Tap the (filled) heart here → unsave. Remove the look from the grid optimistically; revert on failure.
  const handleUnsave = async (itemId: string) => {
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== itemId));
    try {
      const res = await fetch("/api/discovery/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (!res.ok) throw new Error(`unsave ${res.status}`);
    } catch (err) {
      console.error("[Saved] unsave failed:", err);
      setItems(prev);
    }
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <button
          onClick={() => router.push(`/${locale}/inspo`)}
          aria-label={tBack("back")}
          className="grid h-10 w-10 place-items-center rounded-full border border-s-border text-s-ink transition-transform duration-150 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink">Gespeichert</h1>
      </div>

      {!loaded ? (
        <div className="px-1.5"><DiscoveryGridSkeleton /></div>
      ) : items.length === 0 ? (
        <p className="mt-4 max-w-xs px-4 text-[14px] leading-relaxed text-s-ink-2">
          Tippe bei einem Look auf das Herz, um ihn hier zu speichern.
        </p>
      ) : (
        <div className="-mx-0 px-1.5">
          <MasonryGrid
            items={items}
            renderItem={(item) =>
              item.media_type === "tiktok" ? (
                <VideoCard
                  item={item}
                  onClick={() => handleItemClick(item)}
                  isAuthenticated
                  onSave={handleUnsave}
                  saved
                  canSave
                />
              ) : (
                <ItemCard
                  item={item}
                  onClick={() => handleItemClick(item)}
                  isAuthenticated
                  onSave={handleUnsave}
                  saved
                  canSave
                />
              )
            }
          />
        </div>
      )}
    </main>
  );
}
