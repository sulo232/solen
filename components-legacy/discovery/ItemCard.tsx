"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Play, Store } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";
import LikeButton from "./LikeButton";
import { formatStyleTag, formatCreator } from "./format";

interface ItemCardProps {
  item: DiscoveryItem;
  onClick?: () => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  isExpanded?: boolean;
}

// V3-D387 (2026-05-30): CSS-columns masonry card. The image fills a container whose aspect-ratio is the photo's
// NATURAL ratio (self-measured on load; default 9/16 so most cards don't reflow) → varied Pinterest heights.
// Haircut-type chip on the photo (tags[0]); creator below (plain span = the shared CardMeta recipe: ink-2 / 400).
// V3-D386: TikTok thumbs route through the /api/discovery/thumb refresh proxy (fresh signed URL, no CORS).
export default memo(function ItemCard({
  item,
  onClick,
  isAuthenticated = false,
  onAuthRequired,
}: ItemCardProps) {
  const [aspect, setAspect] = useState("9 / 16");
  const isTikTok =
    !!item.tiktok_url || !!item.tiktok_embed_html || item.media_type === "tiktok";
  const displayImage = item.tiktok_url
    ? `/api/discovery/thumb/${item.id}`
    : item.image_url || item.tiktok_thumbnail_url;
  const styleTag = formatStyleTag(item.tags);
  const creator = formatCreator(item.author_name);
  const isSalon = item.source === "salon" || item.content_type === "salon";

  return (
    <div onClick={onClick} className="group w-full cursor-pointer">
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-s-bg-sunken"
        style={{ aspectRatio: aspect }}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={item.alt_text || item.style_name || ""}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) {
                setAspect(`${img.naturalWidth} / ${img.naturalHeight}`);
              }
            }}
          />
        ) : null}

        {/* Light play affordance for video */}
        {isTikTok && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/85 shadow-elevation-2 backdrop-blur-[2px]">
              <Play size={15} className="ml-0.5 text-s-ink" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Canonical heart — top-right */}
        <div className="absolute right-1 top-1" onClick={(e) => e.stopPropagation()}>
          <LikeButton
            itemId={item.id}
            initialLiked={false}
            isAuthenticated={isAuthenticated}
            onAuthRequired={onAuthRequired}
          />
        </div>

        {/* Haircut-type chip — bottom-left on the photo */}
        {styleTag && (
          <span className="absolute bottom-1.5 left-1.5 max-w-[80%] truncate rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-s-ink shadow-elevation-1 backdrop-blur-[2px]">
            {styleTag}
          </span>
        )}
      </div>

      {/* Creator — V3-D389: salon items show the studio name + a store mark (real local studio, taps to the salon);
          TikTok items show the @handle. Both use the CardMeta recipe (text-s-ink-2 / font-normal). */}
      {creator && (
        <span className="mt-1.5 flex items-center gap-1 font-body text-[12px] font-normal text-s-ink-2">
          {isSalon && <Store size={12} className="shrink-0" aria-hidden />}
          <span className="truncate">{creator}</span>
        </span>
      )}
    </div>
  );
});
