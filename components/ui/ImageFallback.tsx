"use client";

import { cn } from "@/lib/utils";

/**
 * Warm blur gradient placeholder for salons without photos.
 * Category-specific gradients with optional salon initial overlay.
 */

const GRADIENTS: Record<string, string> = {
  coiffeur:   "from-[#E8D5C4] via-[#D4A574] to-[#C4956A]",
  barbershop: "from-[#D4C4B0] via-[#B8A08C] to-[#A08868]",
  nails:      "from-[#F0D4D4] via-[#E8B4B4] to-[#D4949E]",
  spa:        "from-[#D4E8D4] via-[#B4D4B4] to-[#94B894]",
  makeup:     "from-[#E8D4E0] via-[#D4B4C8] to-[#C494B0]",
  waxing:     "from-[#F0E0C4] via-[#E8D0A4] to-[#D4B888]",
};

const DEFAULT_GRADIENT = "from-[#EDE5D8] via-[#D4C4B0] to-[#C4B098]";

interface ImageFallbackProps {
  category?: string;
  salonName?: string;
  className?: string;
  /** Show a large initial letter overlay */
  showInitial?: boolean;
}

export default function ImageFallback({
  category,
  salonName,
  className,
  showInitial = true,
}: ImageFallbackProps) {
  const gradient = GRADIENTS[category?.toLowerCase() ?? ""] ?? DEFAULT_GRADIENT;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradient,
        className
      )}
    >
      {/* Warm noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
        }}
      />
      {/* Subtle brand initial */}
      {showInitial && salonName && (
        <span className="absolute inset-0 flex items-center justify-center font-display text-white/20 text-6xl select-none pointer-events-none">
          {salonName[0]}
        </span>
      )}
    </div>
  );
}
