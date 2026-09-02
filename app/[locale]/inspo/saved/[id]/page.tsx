"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import MasonryGrid from "@/components-legacy/discovery/MasonryGrid";
import ItemCard from "@/components-legacy/discovery/ItemCard";
import VideoCard from "@/components-legacy/discovery/VideoCard";
import DiscoveryGridSkeleton from "@/components-legacy/discovery/DiscoveryGridSkeleton";
import type { DiscoveryItem } from "@/lib/types";
import { useTranslations } from "next-intl";

// V3-D414 (Phase 2): a saved collection's detail — its looks in the feed masonry. Focused view (own back).
export default function SavedCollectionPage() {
  const tBack = useTranslations("common");
  const params = useParams<{ id: string; locale: string }>()!;
  const router = useRouter();
  const id = params.id;
  const locale = params.locale;

  const [collection, setCollection] = useState<Record<string, any> | null>(null);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/discovery/collections/${id}`);
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        if (!cancelled) { setCollection(data.collection ?? null); setItems(data.items ?? []); }
      } catch (err) {
        console.error("[SavedCollection] fetch failed:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleItemClick = (item: DiscoveryItem) => {
    if ((item.source === "salon" || item.content_type === "salon") && (item as any).salon_slug) {
      router.push(`/${locale}/salon/${(item as any).salon_slug}`);
      return;
    }
    router.push(`/${locale}/inspo/${item.id}`);
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <button
          onClick={() => router.push(`/${locale}/inspo/saved`)}
          aria-label={tBack("back")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border text-s-ink transition-transform duration-150 active:scale-95"
        >
          <ChevronLeft size={18} strokeWidth={1.9} />
        </button>
        <h1 className="truncate font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink">{collection?.name ?? "Kollektion"}</h1>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        {loading ? (
          <div className="pt-2"><DiscoveryGridSkeleton /></div>
        ) : error ? (
          <p className="py-20 text-center text-[15px] text-s-ink-2">Kollektion nicht gefunden.</p>
        ) : items.length === 0 ? (
          <p className="py-20 text-center text-[15px] text-s-ink-2">Noch keine Looks in dieser Kollektion.</p>
        ) : (
          <div className="-mx-4 px-1.5">
            <MasonryGrid
              items={items}
              renderItem={(item) =>
                item.media_type === "tiktok" ? (
                  <VideoCard item={item} onClick={() => handleItemClick(item)} isAuthenticated />
                ) : (
                  <ItemCard item={item} onClick={() => handleItemClick(item)} isAuthenticated />
                )
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}
