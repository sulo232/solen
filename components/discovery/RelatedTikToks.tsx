"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import type { DiscoveryItem } from "@/lib/types";

interface RelatedTikToksProps {
  itemId: string;
  isCurrentTikTok: boolean;
}

function extractVideoId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

export default function RelatedTikToks({ itemId, isCurrentTikTok }: RelatedTikToksProps) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;
    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/discovery/similar?item_id=${itemId}&media_type=tiktok&limit=3`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setItems(data.items ?? []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchRelated();
    return () => { cancelled = true; };
  }, [itemId]);

  if (!loading && items.length === 0) return null;

  const title = isCurrentTikTok
    ? (locale === "de" ? "Ähnliche Videos" : "Related videos")
    : (locale === "de" ? "Schau dir Tutorials an" : "Watch how to style this");

  return (
    <div className="mt-6 px-1">
      <h3 className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-3">{title}</h3>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="aspect-[9/16] rounded-[16px] bg-s-ink/5 dark:bg-white/5 shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.slice(0, 2).map((item) => {
            const vid = extractVideoId(item.tiktok_url);
            if (!vid) return null;
            return (
              <div key={item.id} className="rounded-[16px] overflow-hidden border border-s-ink/5 dark:border-white/5">
                <div className="aspect-[9/16] relative">
                  <iframe
                    src={`https://www.tiktok.com/embed/v2/${vid}?autoplay=0`}
                    className="absolute inset-0 w-full h-full"
                    allow="encrypted-media"
                    allowFullScreen
                    loading="lazy"
                    title={item.style_name || "TikTok"}
                  />
                </div>
                {item.style_name && (
                  <p className="p-2 text-[11px] font-medium text-s-ink dark:text-s-dm-text truncate">{item.style_name}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
