"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import type { DiscoveryItem } from "@/lib/types";
import { Play, Heart } from "lucide-react";

interface VideoCardProps {
  item: DiscoveryItem;
  onClick?: () => void;
  isAuthenticated?: boolean;
}

export default function VideoCard({ item, onClick }: VideoCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  // IntersectionObserver: lazy-load TikTok embed when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowEmbed(true);
        }
      },
      { threshold: 0.6 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // tiktok_embed_html is fetched server-side from TikTok's official oEmbed API
  // and stored in the database — it is trusted content, not user-generated input.

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className="group relative rounded-card overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 cursor-pointer hover:shadow-warm-md transition-shadow"
    >
      <div className="aspect-[9/16] relative bg-black">
        {showEmbed && item.tiktok_embed_html ? (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${extractVideoId(item.tiktok_url)}`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            loading="lazy"
            title={item.alt_text || "TikTok video"}
          />
        ) : item.tiktok_thumbnail_url ? (
          <>
            <Image
              src={item.tiktok_thumbnail_url}
              alt={item.alt_text || ""}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <Play size={20} className="text-white ml-0.5" fill="white" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white/20">
            <Play size={32} />
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-black/60 text-white/90 backdrop-blur-sm font-medium">
            TikTok
          </span>
        </div>
      </div>

      <div className="p-2.5 space-y-1">
        {item.style_name && (
          <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{item.style_name}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral font-medium capitalize">{item.category}</span>
          <div className="flex items-center gap-2 text-[10px] text-s-ink/30 dark:text-s-dm-text/30">
            {item.author_name && <span className="truncate max-w-[80px]">@{item.author_name}</span>}
            <span className="flex items-center gap-0.5"><Heart size={10} /> {item.like_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Extract TikTok video ID from URL for iframe embed */
function extractVideoId(url: string | null): string {
  if (!url) return "";
  const match = url.match(/\/video\/(\d+)/);
  return match?.[1] ?? "";
}
