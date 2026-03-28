"use client";

import Image from "next/image";
import { Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StaffMember } from "@/lib/types";

interface StaffPickerProps {
  staffList: StaffMember[];
  selectedStaff: string;
  onSelect: (staffId: string) => void;
}

export default function StaffPicker({ staffList, selectedStaff, onSelect }: StaffPickerProps) {
  const t = useTranslations("staffPicker") as any;

  if (staffList.length === 0) return null;

  return (
    <div className="px-4 pt-4">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40 dark:text-s-dm-text/40 mb-3">
        {t("title")}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {/* "Egal" option */}
        <button
          onClick={() => onSelect("any")}
          className={`shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-[14px] border transition-[border-color,background-color,box-shadow,transform] duration-150 ${
            selectedStaff === "any"
              ? "border-s-coral ring-2 ring-s-coral/30 bg-s-coral/[0.06]"
              : "border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-surface hover:-translate-y-[4px] hover:border-s-coral/40 hover:shadow-warm-sm"
          }`}
          style={{ minWidth: "90px" }}
        >
          <div className="w-12 h-12 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg flex items-center justify-center">
            <Users size={20} className="text-s-ink/30 dark:text-s-dm-text/30" />
          </div>
          <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{t("any")}</span>
        </button>

        {/* Staff cards */}
        {staffList.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-[14px] border transition-[border-color,background-color,box-shadow,transform] duration-150 ${
              selectedStaff === s.id
                ? "border-s-coral ring-2 ring-s-coral/30 bg-s-coral/[0.06]"
                : "border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-surface hover:-translate-y-[4px] hover:border-s-coral/40 hover:shadow-warm-sm"
            }`}
            style={{ minWidth: "90px" }}
          >
            <div className="w-12 h-12 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden flex items-center justify-center">
              {s.avatar_url ? (
                <Image
                  src={s.avatar_url}
                  alt={s.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-s-ink/20 dark:text-s-dm-text/20">
                  {s.name[0]}
                </span>
              )}
            </div>
            <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text text-center leading-tight max-w-[80px] truncate">
              {s.name}
            </span>
            {s.specialties?.length > 0 && (
              <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 text-center leading-tight max-w-[80px] truncate">
                {s.specialties[0]}
              </span>
            )}
            {s.average_rating != null && s.average_rating > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-s-ink/50 dark:text-s-dm-text/50">
                <Star size={8} className="fill-s-coral text-s-coral" />
                <span className="data-text">{s.average_rating.toFixed(1)}</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
