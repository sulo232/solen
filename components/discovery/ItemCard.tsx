"use client";

import { memo } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";
import { motion } from "framer-motion";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";

interface ItemCardProps {
  item: DiscoveryItem;
  onClick?: () => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  isExpanded?: boolean;
}

// ── Color-coded category badges ────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  hair: "bg-s-amber/70",
  beard: "bg-s-coral/70",
  nails: "bg-s-plum/70",
  makeup: "bg-s-plum/70",
  waxing: "bg-s-sage/70",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  salon: "Salon",
  curated: "Inspo",
  user: "Community",
};

export default memo(function ItemCard({
  item,
  onClick,
  isAuthenticated = false,
  onAuthRequired,
  isExpanded = false,
}: ItemCardProps) {
  const displayImage = item.image_url || item.tiktok_thumbnail_url;
  const isTikTok =
    !!item.tiktok_url || !!item.tiktok_embed_html || item.media_type === "tiktok";
  const categoryBg = CATEGORY_COLORS[item.category] ?? "bg-white/50";
  const contentLabel = CONTENT_TYPE_LABELS[isTikTok ? "tiktok" : item.content_type] ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      onClick={onClick}
      className="group relative rounded-[16px] overflow-hidden cursor-pointer active:scale-[0.97] transition-transform duration-150 w-full h-full"
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0 bg-s-ink overflow-hidden">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={item.alt_text || item.style_name || ""}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : null}

        {/* TikTok play button overlay */}
        {isTikTok && (
          <div className="absolute inset-0 flex items-center justify-center bg-s-ink/20">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play size={16} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* TikTok fallback when thumbnail fails */}
        {isTikTok && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-s-ink to-s-ink -z-10 gap-3">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white/30" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.19 8.19 0 004.76 1.52V6.78a4.83 4.83 0 01-1-.09z" />
            </svg>
            <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
              <Play size={16} className="text-white/30 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* ── Top-left: Category + content type badge ── */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

      <div className="absolute top-2 left-2 z-10">
        <span
          className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-pill backdrop-blur-[6px] font-medium text-white ${categoryBg}`}
        >
          <span className="capitalize">{item.category}</span>
          {contentLabel && (
            <>
              <span className="opacity-60">·</span>
              <span>{contentLabel}</span>
            </>
          )}
        </span>
      </div>

      {/* ── Top-right: Like + Save buttons ── */}
      <div
        className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 bg-white/30 backdrop-blur-[6px] rounded-pill px-1.5 py-1">
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
        <div className="absolute bottom-2 left-2 right-2 z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-white/30 backdrop-blur-[6px] rounded-pill px-2.5 py-1.5 max-w-[70%]">
            <p className="text-[11px] font-medium text-white truncate">
              {item.style_name}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
});
