"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StaffMember } from "@/lib/types";
import { SelectedCheckBadge } from "@/components-legacy/ui/SelectedCheckBadge";
import { Avatar } from "@/app/[locale]/_components/primitives";

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

  // V3-D421: selected-state is now the SelectedCheckBadge (corner check), not a ring.
  const circle = () =>
    "h-[88px] w-[88px] rounded-full grid place-items-center overflow-hidden bg-s-bg-sunken";

  return (
    <div className="-mx-4 px-4 flex gap-4 overflow-x-auto pt-2 pb-3 scrollbar-hide">
      {/* Keine Präferenz */}
      <button
        onClick={() => onSelect("any")}
        aria-label={t("any")}
        className="shrink-0 flex flex-col items-center w-[88px]"
      >
        <div className="relative">
          <div className={circle()}>
            <Users size={26} className="text-s-ink-2" strokeWidth={2} />
          </div>
          <SelectedCheckBadge selected={selectedStaff === "any"} />
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
              <Avatar
                src={s.avatar_url}
                name={s.name}
                size={88}
                badge={rating != null ? { rating } : undefined}
              />
              <SelectedCheckBadge selected={selectedStaff === s.id} />
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
              <span className="mt-0.5 max-w-[88px] truncate text-center text-[12px] leading-tight tracking-wide text-s-ink-3">
                {s.languages.map((l) => l.toUpperCase()).join(" / ")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
