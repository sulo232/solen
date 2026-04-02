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
      <p className="text-[11px] font-heading font-bold uppercase tracking-[0.12em] text-[#E8624A] mb-2">
        Team
      </p>
      <h2 className="font-heading font-bold text-[20px] text-[#222222] mb-4">
        Unser Team
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {staff.map((m) => (
          <Link
            key={m.id}
            href={`/${locale}/salon/${salonSlug}/staff/${m.id}`}
            className="shrink-0 w-[200px] flex flex-col rounded-[16px] border border-[#EBEBEB] bg-white p-4 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
          >
            {/* Avatar */}
            <div className="block">
              <div className="relative w-16 h-16 mx-auto mb-3">
                <div className="w-16 h-16 rounded-full bg-[#F0F0F0] overflow-hidden flex items-center justify-center">
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
                    <span className="text-xl font-bold text-[#222222]/20">
                      {m.name[0]}
                    </span>
                  )}
                </div>
                {/* Rating badge overlay */}
                {m.average_rating != null && m.average_rating > 0 && (
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-[#EBEBEB]">
                    <Star size={8} className="fill-[#E8624A] text-[#E8624A]" />
                    <span className="text-[9px] font-semibold text-[#222222]">
                      {m.average_rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="font-heading font-semibold text-[14px] text-[#222222] text-center truncate">
                {m.name}
              </p>

              {/* Languages */}
              {m.languages && m.languages.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-1">
                  {m.languages.map((lang: string) => (
                    <span key={lang} className="text-[9px] font-heading font-bold uppercase tracking-[.06em] px-1.5 py-0.5 rounded-sm bg-[#F0F0F0] text-[#6A6A6A]">
                      {lang}
                    </span>
                  ))}
                </div>
              )}

              {/* Specialties */}
              {m.specialties?.length > 0 && (
                <p className="text-[11px] text-[#6A6A6A] text-center truncate mt-1">
                  {m.specialties.slice(0, 2).join(", ")}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#EBEBEB]">
              {m.average_rating != null && m.average_rating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-[#E8624A] text-[#E8624A]" />
                  <span className="text-[12px] font-medium text-[#222222]">{m.average_rating.toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-[12px] text-[#6A6A6A]">Neu</span>
              )}

              {/* Next slot mock - in prod this would fetch from an API */}
              <div className="text-right">
                <p className="text-[9px] font-heading font-semibold uppercase tracking-wider text-[#6A6A6A]">Nächster Termin</p>
                <p className="text-[12px] font-medium text-[#2E7D32]">Morgen, 10:00</p>
              </div>
            </div>

            {/* Book button */}
            <button
              onClick={(e) => { e.preventDefault(); onBook?.(m.id); }}
              className="w-full mt-3 py-2 rounded-full active:scale-[0.98] bg-[#E8624A]/10 text-[#E8624A] hover:bg-[#E8624A] hover:text-white text-[12px] font-semibold uppercase tracking-[.06em] transition-[background-color,color] duration-150"
            >
              Wählen
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
