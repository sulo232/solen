"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Instagram, ExternalLink } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
}

interface PortfolioImage {
  id: string;
  image_url: string;
  caption: string | null;
}

interface StaffPortfolioProps {
  staff: StaffMember;
  salonId: string;
  instagramUrl?: string | null;
  onBookWith?: (staffId: string) => void;
}

export default function StaffPortfolio({ staff, salonId, instagramUrl, onBookWith }: StaffPortfolioProps) {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/salons/${salonId}/staff/${staff.id}/portfolio`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (!cancelled) setImages(data.images ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [salonId, staff.id]);

  return (
    <div className="p-4 rounded-[16px] bg-[--raised] dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-s-ink/5 dark:bg-white/5 overflow-hidden shrink-0">
          {staff.avatar_url ? (
            <Image src={staff.avatar_url} alt={staff.name} width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full text-lg font-medium text-s-ink/30 dark:text-s-dm-text/30">
              {staff.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{staff.name}</h4>
          {staff.specialties.length > 0 && (
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 truncate">
              {staff.specialties.join(", ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-s-ink/5 dark:hover:bg-white/5 text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral transition-colors">
              <Instagram size={14} />
            </a>
          )}
          {onBookWith && (
            <button
              onClick={() => onBookWith(staff.id)}
              className="text-xs px-3 py-1.5 rounded-pill bg-s-coral text-white hover:brightness-[1.06] transition-colors"
            >
              Book
            </button>
          )}
        </div>
      </div>

      {/* Portfolio grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-square rounded-btn bg-s-ink/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {images.slice(0, 6).map((img) => (
            <div key={img.id} className="aspect-square rounded-btn overflow-hidden relative">
              <Image src={img.image_url} alt={img.caption ?? ""} fill className="object-cover" sizes="33vw" />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-s-ink/20 dark:text-s-dm-text/20 text-center py-4">No portfolio yet</p>
      )}
    </div>
  );
}
