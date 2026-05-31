"use client";

import Image from "next/image";
import { Users, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StaffMember } from "@/lib/types";

interface StaffPickerProps {
  staffList: StaffMember[];
  selectedStaff: string;
  onSelect: (staffId: string) => void;
}

/**
 * StaffPicker — booking stylist row (Fresha team-list look).
 *   • 88px avatar, selected = hugging ink ring (matches the service-card border).
 *   • Gold ★ rating PILL overlapping the avatar's bottom edge (Fresha).
 *   • name + role (first specialty).
 * Carousel has pt/pb so neither the ring (top) nor the pill (bottom) clip.
 */
export default function StaffPicker({ staffList, selectedStaff, onSelect }: StaffPickerProps) {
  const t = useTranslations("staffPicker") as any;
  if (staffList.length === 0) return null;

  const circle = (sel: boolean) =>
    `h-[88px] w-[88px] rounded-full grid place-items-center overflow-hidden bg-s-bg-sunken ${
      sel ? "ring-2 ring-s-ink" : ""
    }`;

  const Pill = ({ rating }: { rating: number }) => (
    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.14)] ring-1 ring-s-ink/[0.05]">
      <Star size={11} fill="#FFC32B" stroke="none" />
      <span className="text-[12px] font-semibold leading-none tabular-nums text-s-ink">
        {rating.toFixed(1)}
      </span>
    </span>
  );

  return (
    <div className="-mx-4 px-4 flex gap-4 overflow-x-auto pt-2 pb-3 scrollbar-hide">
      {/* Keine Präferenz */}
      <button
        onClick={() => onSelect("any")}
        aria-label={t("any")}
        className="shrink-0 flex flex-col items-center w-[88px]"
      >
        <div className="relative">
          <div className={circle(selectedStaff === "any")}>
            <Users size={26} className="text-s-ink-2" strokeWidth={2} />
          </div>
        </div>
        <span className="mt-3 text-[14px] font-body font-medium text-s-ink text-center leading-tight">
          {t("any")}
        </span>
      </button>

      {/* Staff */}
      {staffList.map((s) => {
        const rating =
          s.average_rating != null && s.average_rating > 0 ? s.average_rating : null;
        const role = s.specialties?.[0] ?? null;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="shrink-0 flex flex-col items-center w-[88px]"
          >
            <div className="relative">
              <div className={circle(selectedStaff === s.id)}>
                {s.avatar_url ? (
                  <Image
                    src={s.avatar_url}
                    alt={s.name}
                    width={88}
                    height={88}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-display text-[30px] font-semibold text-s-ink-2">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {rating != null && <Pill rating={rating} />}
            </div>
            <span
              className={`text-[14px] font-body font-medium text-s-ink text-center leading-tight truncate max-w-[88px] ${
                rating != null ? "mt-4" : "mt-3"
              }`}
            >
              {s.name}
            </span>
            {role && (
              <span className="text-[12px] text-s-ink-2 text-center leading-tight truncate max-w-[88px]">
                {role}
              </span>
            )}
            {s.languages && s.languages.length > 0 && (
              <span className="mt-0.5 max-w-[88px] truncate text-center text-[11px] leading-tight tracking-wide text-s-ink-3">
                {s.languages.map((l) => l.toUpperCase()).join(" / ")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
