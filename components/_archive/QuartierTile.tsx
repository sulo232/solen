"use client";

import Link from "next/link";
import { Heart, CheckCircle, Landmark, Drama, TreePine, Anchor, Trees, Home, Waves, MapPin } from "lucide-react";

interface QuartierTileProps {
  name: string;
  slug: string;
  count: number;
  visited?: boolean;
  favorited?: boolean;
  locale?: string;
}

const quartierIcon: Record<string, typeof Landmark> = {
  grossbasel: Landmark,
  kleinbasel: Drama,
  gundeli: TreePine,
  st_johann: Anchor,
  iselin: Trees,
  bruderholz: Home,
  breite: Waves,
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
      className="relative flex-shrink-0 w-40 h-24 rounded-[12px] bg-white dark:bg-s-dm-raised shadow-warm-sm hover:shadow-warm-lg hover:-translate-y-[5px] transition-[transform,box-shadow] duration-250 flex flex-col justify-between p-3 overflow-hidden group"
    >
      {/* Icon background */}
      {(() => {
        const Icon = quartierIcon[slug] ?? MapPin;
        return <Icon className="absolute right-2 bottom-2 w-10 h-10 text-s-ink/5 group-hover:text-s-ink/10 transition-colors select-none" />;
      })()}

      {/* Top row */}
      <div className="flex items-start justify-between">
        <p className="font-heading font-semibold text-s-ink text-sm leading-tight">{name}</p>
        {favorited && <Heart className="w-4 h-4 fill-s-coral text-s-coral shrink-0" />}
      </div>

      {/* Bottom row */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs data-text text-s-ink/50">{count} Salons</span>
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
