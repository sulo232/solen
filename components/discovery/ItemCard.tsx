"use client";

import Image from "next/image";
import type { DiscoveryItem } from "@/lib/types";
import { Heart, Bookmark } from "lucide-react";

interface ItemCardProps {
  item: DiscoveryItem;
  onClick?: () => void;
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const priceLabel = item.price_min && item.price_max
    ? `CHF ${item.price_min}–${item.price_max}`
    : item.price_min ? `ab CHF ${item.price_min}` : null;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-card overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 cursor-pointer hover:shadow-warm-md transition-shadow"
    >
      <div className="aspect-[3/4] relative bg-s-ink/5 dark:bg-white/5">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.alt_text || item.style_name || ""}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-s-ink/10 dark:text-s-dm-text/10 text-sm">No image</div>
        )}

        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded-pill bg-black/40 text-white/80 backdrop-blur-sm">
            {item.source}
          </span>
        </div>

        {/* Price badge */}
        {priceLabel && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] px-2 py-1 rounded-pill bg-white/90 dark:bg-s-dm-surface/90 text-s-ink dark:text-s-dm-text font-medium backdrop-blur-sm">
              {priceLabel}
            </span>
          </div>
        )}
      </div>

      <div className="p-2.5 space-y-1">
        {item.style_name && (
          <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{item.style_name}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral font-medium capitalize">
            {item.category}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-s-ink/30 dark:text-s-dm-text/30">
            <span className="flex items-center gap-0.5"><Heart size={10} /> {item.like_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
