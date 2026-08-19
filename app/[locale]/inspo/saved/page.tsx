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
          <ArrowLeft size={18} strokeWidth={1.9} />
        </button>
        <h1 className="font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink">Gespeichert</h1>
      </div>

      {!loaded ? (
        <div className="px-1.5"><DiscoveryGridSkeleton /></div>
      ) : items.length === 0 ? (
        // E1 (2026-08-11): this screen used to be a heading and one line of text, with no control
        // at all, so the only way out was the bottom bar. The locked empty-state anatomy in this
        // project asks for a line that says what to do and a filled ink button pointing at the
        // action that fills the screen. Here that action is the Inspo feed, which is where the
        // hearts live. No new copy and no new value: the sentence is the one that already shipped,
        // the button reuses the feed's own name, and its recipe is the same ink pill the search
        // panel's own submit uses.
        <div className="mt-4 px-4"> {/* mockup-ok: adds the missing way out to a locked empty state */}
          <p className="max-w-xs text-[14px] leading-relaxed text-s-ink-2">
            Tippe bei einem Look auf das Herz, um ihn hier zu speichern.
          </p>
          <button
            onClick={() => router.push(`/${locale}/inspo`)}
            className="mt-5 inline-flex h-11 items-center rounded-full bg-s-ink px-6 font-heading text-[15px] font-bold text-white transition-transform duration-150 active:scale-[0.98]" /* selected-ok: the one commit action on this screen. mockup-ok */
          >
            Inspo
          </button>
        </div>
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
