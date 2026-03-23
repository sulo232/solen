"use client";

import { useState, useEffect, memo } from "react";
import type { DiscoveryItem } from "@/lib/types";
import { Play } from "lucide-react";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";

interface VideoCardProps {
  item: DiscoveryItem;
  onClick?: () => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
}

// ── Color-coded category badges ────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  hair: "bg-s-amber/70",
  beard: "bg-orange-500/70",
  nails: "bg-pink-500/70",
  makeup: "bg-purple-500/70",
  waxing: "bg-teal-500/70",
};

/**
 * Grid card for TikTok videos.
 * Shows thumbnail + play overlay — clicking navigates to detail page.
 * No iframe in grid (blocks clicks + shows black).
 */
export default memo(function VideoCard({
  item,
  onClick,
  isAuthenticated = false,
  onAuthRequired,
}: VideoCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    item.tiktok_thumbnail_url || item.image_url || null
  );
  const [imgError, setImgError] = useState(false);

  // If no stored thumbnail, or stored one fails, try oEmbed for fresh one
  useEffect(() => {
    if (thumbnailUrl && !imgError) return;
    if (!item.tiktok_url) return;

    fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(item.tiktok_url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.thumbnail_url) {
          setThumbnailUrl(data.thumbnail_url);
          setImgError(false);
        }
      })
      .catch(() => {});
  }, [thumbnailUrl, imgError, item.tiktok_url]);

  const categoryBg = CATEGORY_COLORS[item.category] ?? "bg-white/50";

  return (
    <div
      onClick={onClick}
      className="group relative rounded-[16px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-150 w-full h-full"
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0 bg-s-ink overflow-hidden">
        {thumbnailUrl && !imgError ? (
          <img
            src={thumbnailUrl}
            alt={item.alt_text || item.style_name || ""}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : null}

        {/* Play button overlay — always visible */}
        <div className="absolute inset-0 flex items-center justify-center bg-s-ink/20">
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play size={16} className="text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Fallback when image fails — TikTok logo + play */}
        {(!thumbnailUrl || imgError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 -z-10">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white/30" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.19 8.19 0 004.76 1.52V6.78a4.83 4.83 0 01-1-.09z" />
            </svg>
            <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
              <Play size={16} className="text-white/30 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* ── Top-left: Category badge ── */}
      <div className="absolute top-2 left-2 z-10">
        <span
          className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-pill backdrop-blur-md font-medium text-white ${categoryBg}`}
        >
          <span className="capitalize">{item.category}</span>
          <span className="opacity-60">·</span>
          <span>TikTok</span>
        </span>
      </div>

      {/* ── Top-right: Like + Save buttons ── */}
      <div
        className="absolute top-2 right-2 z-10 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-pill px-1.5 py-1">
          <LikeButton
            itemId={item.id}
            initialLiked={false}
            initialCount={item.like_count}
            isAuthenticated={isAuthenticated}
            onAuthRequired={onAuthRequired}
          />
          <SaveButton
            itemId={item.id}
            initialSaved={false}
            isAuthenticated={isAuthenticated}
            onAuthPrompt={onAuthRequired}
          />
        </div>
      </div>

      {/* ── Bottom: Glassmorphism info pill ── */}
      {item.style_name && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-pill px-2.5 py-1.5 max-w-[70%]">
            <p className="text-[11px] font-medium text-white truncate">
              {item.style_name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
