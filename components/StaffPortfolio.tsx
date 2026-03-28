"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Star, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { StaffMember } from "@/lib/types";

interface PortfolioImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface StaffPortfolioProps {
  member: StaffMember;
  images?: PortfolioImage[];
  salonSlug: string;
  onBook?: (staffId: string) => void;
}

export default function StaffPortfolio({ member, images = [], salonSlug, onBook }: StaffPortfolioProps) {
  const locale = useLocale();
  const t = useTranslations("staffPortfolio") as any;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="rounded-[12px] border border-s-ink/5 dark:border-white/5 p-4 bg-white dark:bg-s-dm-surface">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden shrink-0 flex items-center justify-center">
          {member.avatar_url ? (
            <Image src={member.avatar_url} alt={member.name} width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg font-bold text-s-ink/30 dark:text-s-dm-text/30">{member.name[0]}</span>
          )}
        </div>
        <div>
          <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text">{member.name}</p>
          {member.specialties?.length > 0 && (
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{member.specialties.join(", ")}</p>
          )}
          {member.average_rating != null && member.average_rating > 0 && (
            <p className="flex items-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
              <Star size={10} className="fill-s-coral text-s-coral" />
              <span className="data-text">{member.average_rating.toFixed(1)}</span>
              {member.review_count != null && member.review_count > 0 && (
                <span className="text-s-ink/30 dark:text-s-dm-text/30">({member.review_count})</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {member.bio && (
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-3 leading-relaxed">
          {member.bio}
        </p>
      )}

      {/* Instagram-style photo grid */}
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mb-3 rounded-[12px] overflow-hidden">
          {sortedImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              className="aspect-square bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden hover:brightness-[0.95] transition-[filter] duration-150"
            >
              <Image
                src={img.image_url}
                alt={`${member.name} portfolio ${i + 1}`}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Book button */}
      <button
        onClick={() => onBook?.(member.id)}
        className="w-full py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-[transform,filter] shadow-warm-sm"
      >
        {t("book_with", { name: member.name })}
      </button>

      {/* Lightbox with navigation */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-modal bg-s-ink/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-4 text-white/80 hover:text-white"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {lightboxIndex < sortedImages.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-4 text-white/80 hover:text-white"
            >
              <ChevronRight size={32} />
            </button>
          )}
          <Image
            src={sortedImages[lightboxIndex].image_url}
            alt=""
            width={800}
            height={800}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-[12px]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
