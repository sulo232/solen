"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import type { SalonCard as SalonCardType } from "@/lib/types";

interface SalonCardProps {
  salon: SalonCardType;
  variant?: "default" | "compact";
  locale?: string;
}

const quartierLabels: Record<string, string> = {
  grossbasel: "Grossbasel",
  kleinbasel: "Kleinbasel",
  gundeli: "Gundeli",
  st_johann: "St. Johann",
  iselin: "Iselin",
  bruderholz: "Bruderholz",
  breite: "Breite",
};

export default function SalonCard({ salon, variant = "default", locale = "de" }: SalonCardProps) {
  const href = `/${locale}/salon/${salon.slug}`;

  if (variant === "compact") {
    return (
      <Link href={href} className="flex items-center gap-3 p-3 rounded-card bg-white shadow-card hover:shadow-md transition-shadow">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          {salon.cover_photo_url && (
            <Image src={salon.cover_photo_url} alt={salon.name} fill className="object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-dark truncate">{salon.name}</p>
          <p className="text-xs text-dark/50">{quartierLabels[salon.quartier] ?? salon.quartier}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-coral text-coral" />
            <span className="text-xs font-data text-dark/70">{salon.average_rating.toFixed(1)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="block rounded-card bg-white shadow-card hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Photo */}
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        {salon.cover_photo_url ? (
          <Image
            src={salon.cover_photo_url}
            alt={salon.name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-dark/20 text-4xl font-heading">
            {salon.name[0]}
          </div>
        )}
        {/* Category pills */}
        <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
          {salon.categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded-pill bg-dark/60 backdrop-blur-sm text-white text-[10px] font-medium capitalize"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-dark text-base leading-tight">{salon.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-dark/50">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs">{quartierLabels[salon.quartier] ?? salon.quartier}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-coral text-coral" />
            <span className="text-sm font-data font-medium text-dark">{salon.average_rating.toFixed(1)}</span>
            <span className="text-xs text-dark/40">({salon.review_count})</span>
          </div>
          {salon.last_minute_discount_percent > 0 && (
            <span className="px-2 py-0.5 rounded-pill bg-coral/10 text-coral text-xs font-medium">
              -{salon.last_minute_discount_percent}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
