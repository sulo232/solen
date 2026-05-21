"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import LikeButton from "@/components-legacy/discovery/LikeButton";
import SaveButton from "@/components-legacy/discovery/SaveButton";

interface NailDesignCardProps {
  id: string;
  imageUrl: string;
  style?: string | null;
  shape?: string | null;
  material?: string | null;
  staffName?: string;
  salonName?: string;
  likeCount?: number;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  onClick?: () => void;
  showBookCta?: boolean;
  bookingUrl?: string;
}

const BADGE_LABELS: Record<string, string> = {
  gel: "Gel", acrylic: "Acryl", dip_powder: "Dip Powder", polygel: "Polygel",
  press_on: "Press-On", natural: "Natur", shellac: "Shellac",
  french: "French", ombre: "Ombré", chrome: "Chrome", "3d_art": "3D Art",
  marble: "Marble", glitter: "Glitter", matte: "Matte", abstract: "Abstract",
  floral: "Floral", geometric: "Geometric", minimal: "Minimal", maximalist: "Maximalist",
  seasonal: "Seasonal", bridal: "Bridal",
  round: "Rund", square: "Square", oval: "Oval", almond: "Mandel",
  coffin: "Coffin", stiletto: "Stiletto", squoval: "Squoval",
  ballerina: "Ballerina", lipstick: "Lipstick", edge: "Edge",
};

export default function NailDesignCard({
  id,
  imageUrl,
  style,
  shape,
  material,
  staffName,
  salonName,
  likeCount,
  isAuthenticated = false,
  onAuthRequired,
  onClick,
}: NailDesignCardProps) {
  const t = useTranslations("nails") as any;
  // Build compact badge text from first available tag
  const primaryBadge = style ? BADGE_LABELS[style] || style : null;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-[16px] overflow-hidden cursor-pointer active:scale-[0.97] transition-transform duration-150 w-full h-full"
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={imageUrl}
          alt={`Nail design${style ? ` – ${BADGE_LABELS[style] || style}` : ""}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
      </div>

      {/* ── Top-left: Category badge ── */}
      <div className="absolute top-2 left-2 z-10">
        <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-pill backdrop-blur-[6px] font-medium text-white bg-s-plum/70">
          <span>{t("category")}</span>
          {primaryBadge && (
            <>
              <span className="opacity-60">·</span>
              <span>{primaryBadge}</span>
            </>
          )}
        </span>
      </div>

      {/* ── Top-right: Like + Save buttons ── */}
      <div
        className="absolute top-2 right-2 z-10 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 bg-white/30 backdrop-blur-[6px] rounded-pill px-1.5 py-1">
          <LikeButton
            itemId={id}
            initialLiked={false}
            initialCount={likeCount ?? 0}
            isAuthenticated={isAuthenticated}
            onAuthRequired={onAuthRequired}
          />
          <SaveButton
            itemId={id}
            initialSaved={false}
            isAuthenticated={isAuthenticated}
            onAuthPrompt={onAuthRequired}
          />
        </div>
      </div>

      {/* ── Bottom: Salon/staff info pill ── */}
      {(staffName || salonName) && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="bg-white/30 backdrop-blur-[6px] rounded-pill px-2.5 py-1.5 max-w-[70%]">
            <p className="text-[11px] font-medium text-white truncate">
              {staffName}{staffName && salonName ? " · " : ""}{salonName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
