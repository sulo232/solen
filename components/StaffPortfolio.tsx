"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="rounded-card border border-gray-100 p-4 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
          {member.avatar_url ? (
            <Image src={member.avatar_url} alt={member.name} width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg font-bold text-dark/30">{member.name[0]}</span>
          )}
        </div>
        <div>
          <p className="font-heading font-semibold text-dark">{member.name}</p>
          {member.specialties?.length > 0 && (
            <p className="text-xs text-dark/50">{member.specialties.join(", ")}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {(member as StaffMember & { bio?: string }).bio && (
        <p className="text-sm text-dark/60 mb-3 leading-relaxed">
          {(member as StaffMember & { bio?: string }).bio}
        </p>
      )}

      {/* Instagram-style photo grid */}
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mb-3 rounded-card overflow-hidden">
          {sortedImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              className="aspect-square bg-gray-100 overflow-hidden hover:opacity-90 transition-opacity"
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
        className="w-full py-2.5 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors"
      >
        Bei {member.name} buchen
      </button>

      {/* Simple lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-dark/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <Image
            src={sortedImages[lightboxIndex].image_url}
            alt=""
            width={800}
            height={800}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-card"
          />
        </div>
      )}
    </div>
  );
}
