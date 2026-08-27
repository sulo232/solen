"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import MasonryGrid from "@/components-legacy/discovery/MasonryGrid";
import ItemCard from "@/components-legacy/discovery/ItemCard";
import VideoCard from "@/components-legacy/discovery/VideoCard";
import DiscoveryGridSkeleton from "@/components-legacy/discovery/DiscoveryGridSkeleton";
import type { DiscoveryItem } from "@/lib/types";

// V3-D414: board (collection) detail page. Tapping a Kollektion now opens this — hero cover + description +
// the board's looks in the same masonry as the feed. Looks come from /api/discovery/boards/[id] (curated pins,
// no search-logging). Back button returns to the feed.
export default function BoardDetailPage() {
  const t = useTranslations("common");
  const params = useParams<{ id: string; locale: string }>()!;
  const router = useRouter();
  const id = params.id;
  const locale = params.locale;

  const [board, setBoard] = useState<Record<string, any> | null>(null);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // auth (same mechanism as the feed: /api/profile 200 = logged in)
    fetch("/api/profile").then((r) => { if (!cancelled && r.ok) setIsAuthenticated(true); }).catch(() => {});
    (async () => {
      try {
        const res = await fetch(`/api/discovery/boards/${id}`);
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        if (!cancelled) { setBoard(data.board ?? null); setItems(data.items ?? []); }
      } catch (err) {
        console.error("[BoardDetail] fetch failed:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const localName = board
    ? (locale === "de" ? board.name_de : locale === "en" ? board.name_en : locale === "fr" ? board.name_fr : board.name_it) || board.name
    : "";
  const cover = board?.cover_images?.[0] as string | undefined;

  const handleItemClick = (item: DiscoveryItem) => {
    if ((item.source === "salon" || item.content_type === "salon") && (item as any).salon_slug) {
      router.push(`/${locale}/salon/${(item as any).salon_slug}`);
      return;
    }
    router.push(`/${locale}/inspo/${item.id}`);
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Hero cover + title (mockup frame 4) */}
      <div className="relative h-60 bg-s-bg-sunken">
        {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-transform duration-150 active:scale-95 active:duration-[80ms]"
        >
          <ChevronLeft size={18} strokeWidth={1.9} />
        </button>
        {board && (
          <div className="absolute inset-x-4 bottom-4 text-white">
            <p className="font-heading text-[12px] font-semibold tracking-[0.08em] opacity-90">Kollektion</p>
            {/* !text-white: a globals.css base `h1{color}` rule beats inherited text-white (same specificity quirk as the search input) */}
            <h1 className="font-heading text-[26px] font-bold leading-tight tracking-[-0.02em] !text-white">{localName}</h1>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4">
        {board?.description && (
          <p className="py-3 text-[14px] leading-relaxed text-s-ink-2">{board.description}</p>
        )}

        {loading ? (
          <div className="pt-3"><DiscoveryGridSkeleton /></div>
        ) : error ? (
          <p className="py-16 text-center text-[15px] text-s-ink-2">Kollektion nicht gefunden.</p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-s-ink-2">Noch keine Looks in dieser Kollektion.</p>
        ) : (
          <div className="-mx-4 px-1.5">
            <MasonryGrid
              items={items}
              renderItem={(item) =>
                item.media_type === "tiktok" ? (
                  <VideoCard item={item} onClick={() => handleItemClick(item)} isAuthenticated={isAuthenticated} />
                ) : (
                  <ItemCard item={item} onClick={() => handleItemClick(item)} isAuthenticated={isAuthenticated} />
                )
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}
