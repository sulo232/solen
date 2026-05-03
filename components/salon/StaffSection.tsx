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
      <p className="text-[11px] font-heading uppercase tracking-[0.12em] text-s-coral-text mb-2">
        Team
      </p>
      <h2 className="font-heading text-[20px] text-s-ink mb-4">
        Unser Team
      </h2>

      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide overscroll-x-contain">
        {staff.map((m) => (
          <Link
            key={m.id}
            href={`/${locale}/salon/${salonSlug}/staff/${m.id}`}
            className="shrink-0 w-[160px] sm:w-[200px] flex flex-col rounded-[16px] border border-s-ink/[0.08] bg-white p-4 hover:-translate-y-[5px] hover:shadow-elevation-3 transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
          >
            {/* Avatar */}
            <div className="block">
              <div className="relative w-16 h-16 mx-auto mb-3">
                <div className="w-16 h-16 rounded-full bg-s-bg-surface overflow-hidden flex items-center justify-center">
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
                    <span className="text-xl font-bold text-s-ink/20">
                      {m.name[0]}
                    </span>
                  )}
                </div>
                {/* Rating badge overlay */}
                {m.average_rating != null && m.average_rating > 0 && (
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-s-ink/[0.08]">
                    <Star size={8} className="fill-s-amber text-s-amber-text" />
                    <span className="text-[9px] font-semibold text-s-ink">
                      {m.average_rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="font-heading text-[14px] text-s-ink text-center truncate">
                {m.name}
              </p>

              {/* Languages */}
              {m.languages && m.languages.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {m.languages.map((lang: string) => (
                    <span key={lang} className="text-xs font-heading uppercase tracking-[.06em] px-2 py-1 rounded-sm bg-s-bg-surface text-[#9F8A7E]">
                      {lang}
                    </span>
                  ))}
                </div>
              )}

              {/* Specialties */}
              {m.specialties?.length > 0 && (
                <p className="text-[11px] text-[#9F8A7E] text-center truncate mt-1">
                  {m.specialties.slice(0, 2).join(", ")}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-s-ink/[0.08]">
              {m.average_rating != null && m.average_rating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-s-amber text-s-amber-text" />
                  <span className="text-[12px] font-medium text-s-ink">{m.average_rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-[12px] text-[#9F8A7E]">Neu</span>
              )}

              {/* Next slot mock - in prod this would fetch from an API */}
              <div className="text-right">
                <p className="text-[9px] font-heading uppercase tracking-wider text-[#9F8A7E]">Nächster Termin</p>
                <p className="text-[12px] font-medium text-[#16A34A]">Morgen, 10:00</p>
              </div>
            </div>

            {/* Book button */}
            <button
              onClick={(e) => { e.preventDefault(); onBook?.(m.id); }}
              className="w-full mt-3 py-2 rounded-full active:scale-[0.97] bg-s-coral/10 text-s-coral-text hover:bg-s-coral hover:text-white text-[12px] font-semibold uppercase tracking-[.06em] transition-[background-color,color,transform] duration-150"
            >
              Wählen
            </button>
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}
