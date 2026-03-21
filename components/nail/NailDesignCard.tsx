"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import type { NailShape, NailMaterial, NailStyleCategory } from "@/lib/types";

interface NailDesignCardProps {
  id: string;
  imageUrl: string;
  style?: NailStyleCategory | null;
  shape?: NailShape | null;
  material?: NailMaterial | null;
  staffName?: string;
  salonName?: string;
  likeCount?: number;
  bookingUrl?: string;
  /** Show "Diesen Look buchen" CTA */
  showBookCta?: boolean;
}

const BADGE_LABELS: Record<string, string> = {
  gel: "Gel", acrylic: "Acryl", dip_powder: "Dip Powder", polygel: "Polygel",
  press_on: "Press-On", natural: "Natur", shellac: "Shellac",
  french: "French", ombre: "Ombré", chrome: "Chrome", "3d_art": "3D Art",
  marble: "Marble", glitter: "Glitter", matte: "Matte", abstract: "Abstract",
  floral: "Floral", geometric: "Geometric", minimal: "Minimal", maximalist: "Maximalist",
  seasonal: "Seasonal", bridal: "Bridal",
  round: "Rund", square: "Square", oval: "Oval", almond: "Mandel",
  coffin: "Coffin", stiletto: "Stiletto", squoval: "Squoval",
  ballerina: "Ballerina", lipstick: "Lipstick", edge: "Edge",
};

export default function NailDesignCard({
  id,
  imageUrl,
  style,
  shape,
  material,
  staffName,
  salonName,
  likeCount,
  bookingUrl,
  showBookCta = false,
}: NailDesignCardProps) {
  const badges = [style, shape, material].filter(Boolean) as string[];

  return (
    <div className="group rounded-card overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 shadow-card">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={`Nail design${style ? ` – ${BADGE_LABELS[style] || style}` : ""}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {likeCount != null && likeCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/80 dark:bg-s-dm-bg/80 backdrop-blur-sm rounded-pill px-2 py-0.5 text-xs text-s-ink dark:text-s-dm-text">
            <Heart size={12} className="fill-s-coral text-s-coral" />
            {likeCount}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-pill bg-s-coral/10 text-s-coral dark:bg-s-coral/20"
              >
                {BADGE_LABELS[b] || b}
              </span>
            ))}
          </div>
        )}

        {(staffName || salonName) && (
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 truncate">
            {staffName}{staffName && salonName ? " · " : ""}{salonName}
          </p>
        )}

        {showBookCta && bookingUrl && (
          <Link
            href={bookingUrl}
            className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-button bg-s-coral text-white text-xs font-medium hover:bg-s-coral-hover transition-colors"
          >
            <Sparkles size={12} />
            Diesen Look buchen
          </Link>
        )}
      </div>
    </div>
  );
}
