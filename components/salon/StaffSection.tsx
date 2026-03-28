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
          <Link
            key={m.id}
            href={`/${locale}/salon/${salonSlug}/staff/${m.id}`}
            className="shrink-0 w-[200px] flex flex-col rounded-[16px] border border-s-ink/5 dark:border-white/5 bg-[--raised] dark:bg-s-dm-surface p-4 hover:-translate-y-[5px] transition-[transform,box-shadow] duration-[250ms] shadow-warm-sm hover:shadow-card-hover"
          >
            {/* Avatar */}
            <div className="block">
              <div className="relative w-16 h-16 mx-auto mb-3">
                <div className="w-16 h-16 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden flex items-center justify-center">
                  {m.avatar_url ? (
                    <Image
                      src={m.avatar_url}
                      alt={m.name}
                      width={64}
                      height={64}
                      sizes="64px"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-s-ink/20 dark:text-s-dm-text/20">
                      {m.name[0]}
                    </span>
                  )}
                </div>
                {/* Rating badge overlay */}
                {m.average_rating != null && m.average_rating > 0 && (
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-[--raised] dark:bg-s-dm-surface px-1.5 py-0.5 rounded-pill shadow-warm-xs border border-s-ink/5 dark:border-white/5">
                    <Star size={8} className="fill-s-coral text-s-coral" />
                    <span className="text-[9px] data-text font-semibold text-s-ink dark:text-s-dm-text">
                      {m.average_rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text text-center truncate">
                {m.name}
              </p>

              {/* Languages */}
              {m.languages && m.languages.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {m.languages.map((lang: string) => (
                    <span key={lang} className="text-[9px] font-heading font-bold uppercase tracking-[.06em] px-1.5 py-0.5 rounded-sm bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60">
                      {lang}
                    </span>
                  ))}
                </div>
              )}

              {/* Specialties */}
              {m.specialties?.length > 0 && (
                <p className="text-[11px] text-s-ink/50 dark:text-s-dm-text/50 text-center truncate mt-1">
                  {m.specialties.slice(0, 2).join(", ")}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-s-ink/5 dark:border-white/5">
              {m.average_rating != null && m.average_rating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-s-coral text-s-coral" />
                  <span className="text-xs font-medium text-s-ink dark:text-s-dm-text">{m.average_rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30">Neu</span>
              )}

              {/* Next slot mock - in prod this would fetch from an API */}
              <div className="text-right">
                <p className="text-[9px] font-heading font-semibold uppercase tracking-wider text-s-ink/40 dark:text-s-dm-text/40">Nächster Termin</p>
                <p className="text-xs font-medium text-s-green">Morgen, 10:00</p>
              </div>
            </div>

            {/* Book button */}
            <button
              onClick={(e) => { e.preventDefault(); onBook?.(m.id); }}
              className="w-full mt-3 py-2 rounded-pill active:scale-[0.98] bg-s-coral/10 text-s-coral hover:bg-s-coral hover:text-white text-xs font-semibold uppercase tracking-[.06em] transition-[background-color,color] duration-150"
            >
              Wählen
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
