"use client";

import Link from "next/link";
import { Heart, CheckCircle } from "lucide-react";

interface QuartierTileProps {
  name: string;
  slug: string;
  count: number;
  visited?: boolean;
  favorited?: boolean;
  locale?: string;
}

const quartierEmoji: Record<string, string> = {
  grossbasel: "🏛️",
  kleinbasel: "🌉",
  gundeli: "🌿",
  st_johann: "⚓",
  iselin: "🌳",
  bruderholz: "🏡",
  breite: "🌊",
};

export default function QuartierTile({
  name,
  slug,
  count,
  visited = false,
  favorited = false,
  locale = "de",
}: QuartierTileProps) {
  return (
    <Link
      href={`/${locale}/coiffeur?quartier=${slug}`}
      className="relative flex-shrink-0 w-40 h-24 rounded-card bg-white shadow-card hover:shadow-md transition-all duration-200 flex flex-col justify-between p-3 overflow-hidden group"
    >
      {/* Emoji background */}
      <span className="absolute right-2 bottom-2 text-4xl opacity-10 group-hover:opacity-20 transition-opacity select-none">
        {quartierEmoji[slug] ?? "📍"}
      </span>

      {/* Top row */}
      <div className="flex items-start justify-between">
        <p className="font-heading font-semibold text-dark text-sm leading-tight">{name}</p>
        {favorited && <Heart className="w-4 h-4 fill-s-coral text-s-coral shrink-0" />}
      </div>

      {/* Bottom row */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs data-text text-dark/50">{count} Salons</span>
        {visited && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral text-[10px] font-medium">
            <CheckCircle className="w-2.5 h-2.5" />
            Besucht
          </span>
        )}
      </div>
    </Link>
  );
}
