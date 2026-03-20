"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import DescriptionCard from "./DescriptionCard";
import InfoTabs from "./InfoTabs";
import BookCTA from "./BookCTA";
import ShareButton from "./ShareButton";
import CommentSection from "./CommentSection";

interface DetailPageProps {
  item: DiscoveryItem;
  locale: string;
  isAuthenticated: boolean;
}

function extractVideoId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

export default function DetailPage({ item, locale, isAuthenticated }: DetailPageProps) {
  const [muted, setMuted] = useState(true);
  const isVideo = item.media_type === "video";
  const videoId = extractVideoId(item.tiktok_url);

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* Media */}
      <div className="relative rounded-card overflow-hidden bg-s-ink/5 dark:bg-white/5">
        {isVideo && videoId ? (
          <div className="relative aspect-[9/16] max-h-[70vh]">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${videoId}?autoplay=1&mute=${muted ? 1 : 0}`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="lazy"
            />
            <button
              onClick={() => setMuted(!muted)}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm z-10"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        ) : item.image_url ? (
          <div className="relative aspect-[3/4] max-h-[70vh]">
            <Image
              src={item.image_url}
              alt={item.alt_text || item.style_name || "Discovery item"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>
        ) : (
          <div className="aspect-[3/4] flex items-center justify-center text-s-ink/20 dark:text-s-dm-text/20">
            No media
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between mt-4 px-1">
        <div className="flex items-center gap-4">
          <LikeButton itemId={item.id} initialLiked={false} initialCount={item.like_count} isAuthenticated={isAuthenticated} />
          <SaveButton itemId={item.id} initialSaved={false} isAuthenticated={isAuthenticated} />
        </div>
        <ShareButton item={item} />
      </div>

      {/* Title + tags */}
      <div className="mt-4 px-1">
        {item.style_name && (
          <h1 className="text-xl font-heading font-bold text-s-ink dark:text-s-dm-text">{item.style_name}</h1>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-pill bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {item.author_name && (
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-2">
            by {item.author_url ? (
              <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-s-coral">{item.author_name}</a>
            ) : item.author_name}
          </p>
        )}
      </div>

      {/* Description */}
      <DescriptionCard item={item} locale={locale} />

      {/* Info Tabs (salon script, cut guide, products) */}
      <InfoTabs item={item} locale={locale} />

      {/* Booking CTA */}
      <BookCTA item={item} locale={locale} />

      {/* Comments */}
      <div className="px-1">
        <CommentSection itemId={item.id} isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}
