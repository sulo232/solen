"use client";

import { useState, useEffect, useRef, memo } from "react";
import Image from "next/image";
import type { DiscoveryItem } from "@/lib/types";
import { Play } from "lucide-react";
import LikeButton from "./LikeButton";
import { formatStyleTag, formatCreator } from "./format";
import CardSignals from "./CardSignals";
import { opticalGlyphNudge } from "@/lib/optical";

interface VideoCardProps {
  item: DiscoveryItem;
  onClick?: () => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  isExpanded?: boolean;
  /** When set, the heart opens the Save-to-lookbook sheet for this item instead of toggling a like. */
  onSave?: (itemId: string) => void;
  /** Controlled "saved to a lookbook" fill for the heart (session saves tracked by the page). */
  saved?: boolean;
  /** False hides the heart for items that can't be saved (e.g. the frontend-only salon PROOF mocks, no DB row). */
  canSave?: boolean;
  /** Pinterest-clean variant (used in "More like this"): drops the big center play button + the haircut-type chip so
   *  the card reads as a clean photo pin; a small corner play glyph still marks it as video. */
  minimal?: boolean;
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
  onSave,
  saved = false,
  canSave = true,
  minimal = false,
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
    <div onClick={onClick} className="group w-full cursor-pointer transition-transform duration-150 active:scale-[0.97] active:duration-[80ms] active:ease-glide">
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

        {/* mockup-ok: unchanged box, big center button in the feed; minimal (Pinterest) drops it for a small corner glyph.
            Play is asymmetric (a triangle, visual mass toward the point), so flexbox's bounding-box centering
            reads it off-center; nudged per the owner-approved 2026-07-15 rule (RATIONALE.md:144, lib/optical.ts),
            replacing the old hand-picked ml-0.5/ml-px with the shared formula. */}
        {(!isExpanded || iframeError) && !minimal && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/85 shadow-elevation-2 backdrop-blur-[2px]">
              <Play size={15} style={{ marginLeft: opticalGlyphNudge(15) }} className="text-s-ink" fill="currentColor" />
            </div>
          </div>
        )}
        {minimal && (
          <span className="pointer-events-none absolute bottom-1.5 left-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/40 backdrop-blur-[2px]">
            <Play size={11} style={{ marginLeft: opticalGlyphNudge(11) }} className="text-white" fill="currentColor" />
          </span>
        )}

        {/* Canonical heart — top-right (hidden for non-saveable items, e.g. salon PROOF mocks). */}
        {canSave && (
          <div className="absolute right-1 top-1" onClick={(e) => e.stopPropagation()}>
            <LikeButton
              itemId={item.id}
              initialLiked={false}
              isAuthenticated={isAuthenticated}
              onAuthRequired={onAuthRequired}
              onSave={onSave}
              saved={saved}
            />
          </div>
        )}

        {/* Haircut-type chip — bottom-left on the photo (hidden in the Pinterest-clean minimal variant) */}
        {styleTag && !minimal && (
          <span className="absolute bottom-1.5 left-1.5 max-w-[80%] truncate rounded-full bg-white/90 px-2 py-0.5 text-[12px] font-medium text-s-ink shadow-elevation-1 backdrop-blur-[2px]">
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

      {/* V3-D393: backend-fed booking signals (rating / price / availability). Renders nothing until real data exists. */}
      <CardSignals item={item} />
    </div>
  );
});
