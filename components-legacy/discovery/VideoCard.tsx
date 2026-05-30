"use client";

import { useState, useEffect, useRef, memo } from "react";
import Image from "next/image";
import type { DiscoveryItem } from "@/lib/types";
import { Play } from "lucide-react";
import LikeButton from "./LikeButton";
import { formatStyleTag, formatCreator } from "./format";

interface VideoCardProps {
  item: DiscoveryItem;
  onClick?: () => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  isExpanded?: boolean;
}

const extractTiktokId = (url: string | null) => {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
};

// V3-D387 (2026-05-30): CSS-columns masonry card (varied natural heights via self-measured aspect). V3-D386: thumbnail
// via the /api/discovery/thumb refresh proxy (fresh signed URL, no CORS). Haircut-type chip + creator below. Keeps
// the expand-to-iframe behaviour for the detail view.
export default memo(function VideoCard({
  item,
  onClick,
  isAuthenticated = false,
  onAuthRequired,
  isExpanded = false,
}: VideoCardProps) {
  const [aspect, setAspect] = useState("9 / 16");
  const [imgError, setImgError] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoId = extractTiktokId(item.tiktok_url);
  const styleTag = formatStyleTag(item.tags);
  const creator = formatCreator(item.author_name);

  const thumbnailUrl = item.tiktok_url
    ? `/api/discovery/thumb/${item.id}`
    : item.image_url || item.tiktok_thumbnail_url;

  useEffect(() => {
    if (isExpanded) setIframeError(false);
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded && videoId && !iframeError) {
      iframeTimerRef.current = setTimeout(() => setIframeError(true), 5000);
    }
    return () => {
      if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current);
    };
  }, [isExpanded, videoId, iframeError]);

  return (
    <div onClick={onClick} className="group w-full cursor-pointer">
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-s-bg-sunken"
        style={{ aspectRatio: aspect }}
      >
        {thumbnailUrl && !imgError ? (
          <Image
            src={thumbnailUrl}
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
            onError={() => setImgError(true)}
          />
        ) : null}

        {/* Expanded: TikTok iframe (detail view) */}
        {isExpanded && videoId && !iframeError && (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&muted=1`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media"
            style={{ border: "none" }}
            onLoad={() => {
              if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current);
            }}
            onError={() => setIframeError(true)}
          />
        )}

        {/* Light play affordance */}
        {(!isExpanded || iframeError) && (
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

      {/* Creator (CardMeta recipe: text-s-ink-2 / font-normal) */}
      {creator && (
        <span className="mt-1.5 block truncate font-body text-[12px] font-normal text-s-ink-2">
          {creator}
        </span>
      )}
    </div>
  );
});
