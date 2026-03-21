"use client";

import Image from "next/image";
import type { DiscoveryItem } from "@/lib/types";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import PriceRangeBadge from "./PriceRangeBadge";

interface ItemCardProps {
  item: DiscoveryItem;
  onClick?: () => void;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
}

export default function ItemCard({ item, onClick, isAuthenticated = false, onAuthRequired }: ItemCardProps) {

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
        {(item.price_min || item.price_max) && (
          <div className="absolute bottom-2 left-2">
            <PriceRangeBadge priceMin={item.price_min} priceMax={item.price_max} />
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
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <LikeButton itemId={item.id} initialLiked={false} initialCount={item.like_count} isAuthenticated={isAuthenticated} onAuthRequired={onAuthRequired} />
            <SaveButton itemId={item.id} initialSaved={false} isAuthenticated={isAuthenticated} onAuthPrompt={onAuthRequired} />
          </div>
        </div>
      </div>
    </div>
  );
}
