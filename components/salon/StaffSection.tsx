"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import type { StaffMember } from "@/lib/types";

interface StaffSectionProps {
  staff: StaffMember[];
  salonSlug: string;
  locale: string;
  onBook?: (staffId: string) => void;
}

export default function StaffSection({ staff, salonSlug, locale, onBook }: StaffSectionProps) {
  if (staff.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-heading font-bold uppercase tracking-[0.12em] text-s-amber mb-2">
        Team
      </p>
      <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-4">
        Unser Team
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {staff.map((m) => (
          <div
            key={m.id}
            className="shrink-0 w-[180px] rounded-card border border-s-ink/5 dark:border-white/5 bg-white dark:bg-s-dm-surface p-4 hover:-translate-y-[5px] hover:shadow-warm-md transition-all duration-250"
          >
            {/* Avatar */}
            <Link href={`/${locale}/salon/${salonSlug}/staff/${m.id}`} className="block">
              <div className="w-16 h-16 mx-auto rounded-full bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden flex items-center justify-center mb-3">
                {m.avatar_url ? (
                  <Image
                    src={m.avatar_url}
                    alt={m.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-s-ink/20 dark:text-s-dm-text/20">
                    {m.name[0]}
                  </span>
                )}
              </div>

              {/* Name */}
              <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text text-center truncate">
                {m.name}
              </p>

              {/* Specialties */}
              {m.specialties?.length > 0 && (
                <p className="text-[11px] text-s-ink/50 dark:text-s-dm-text/50 text-center truncate mt-0.5">
                  {m.specialties.slice(0, 2).join(", ")}
                </p>
              )}

              {/* Rating */}
              {m.average_rating != null && m.average_rating > 0 && (
                <p className="flex items-center justify-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-1">
                  <Star size={10} className="fill-s-coral text-s-coral" />
                  <span className="data-text">{m.average_rating.toFixed(1)}</span>
                </p>
              )}
            </Link>

            {/* Book button */}
            <button
              onClick={() => onBook?.(m.id)}
              className="w-full mt-3 py-2 rounded-btn active:scale-[0.98] bg-s-coral text-white text-xs font-medium hover:bg-s-coral-hover transition-all shadow-warm-sm"
            >
              Buchen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
