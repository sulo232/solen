import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Avatar — photo-or-initials circle (CONTRADICTIONS.md §4).
 * Layer 1 (chrome): avatars carry no semantic meaning per initial, so the
 * fallback palette is the B&W stone ramp (V3-D202), NOT colour-coded.
 *
 * Replaces 6+ hand-rolled photo-or-initial blocks + the 3× copy-pasted staff
 * floating-rating badge. Owns the canonical `avatarColor()` (was duplicated in
 * salon/_shared.ts — that one re-exports from here during migration).
 */
const AVATAR_PALETTE = [
  { bg: "#F5F5F4", fg: "#0A0A0A" }, // s-bg-sunken + s-ink
  { bg: "#E7E5E4", fg: "#0A0A0A" }, // s-border + s-ink
  { bg: "#D6D3D1", fg: "#0A0A0A" }, // stone-300 + s-ink
  { bg: "#A8A29E", fg: "#FFFFFF" }, // stone-400 + white (inverse for variety)
];

/** Deterministic greyscale avatar colour from a name. Stable, stores nothing. */
export function avatarColor(name: string | null | undefined): { bg: string; fg: string } {
  const ch = (name ?? "?").charCodeAt(0) || 0;
  return AVATAR_PALETTE[ch % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZE_PX: Record<AvatarSize, number> = { xs: 28, sm: 36, md: 44, lg: 56 };
const FONT_CLS: Record<AvatarSize, string> = {
  xs: "text-[12px]",
  sm: "text-[13px]",
  md: "text-[15px]",
  lg: "text-[18px]",
};

export interface AvatarProps {
  /** Photo URL. Falls back to initials when null/empty. */
  src?: string | null;
  /** Person/salon name — drives initials + fallback colour + alt text. */
  name: string;
  /** Named size token, or an explicit pixel number for sizes outside the scale (e.g. 88 on staff cards, 104 hero). */
  size?: AvatarSize | number;
  /** Staff variant: floating star-rating badge at the bottom edge. */
  badge?: { rating: number };
  className?: string;
}

export function Avatar({ src, name, size = "md", badge, className }: AvatarProps) {
  const px = typeof size === "number" ? size : SIZE_PX[size];
  const { bg, fg } = avatarColor(name);

  return (
    <span
      className={cn("relative inline-block shrink-0 align-middle", className)}
      style={{ width: px, height: px }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote avatar src; tiny, optimisation negligible
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span
          className={cn(
            "grid h-full w-full place-items-center rounded-full font-heading font-semibold",
            typeof size !== "number" ? FONT_CLS[size] : undefined,
          )}
          style={{
            background: bg,
            color: fg,
            fontSize: typeof size === "number" ? Math.round(px * 0.4) : undefined,
          }}
          aria-label={name}
        >
          {initials(name)}
        </span>
      )}
      {badge && (
        <span className="absolute -bottom-1 left-1/2 inline-flex -translate-x-1/2 items-center gap-[2px] whitespace-nowrap rounded-full border border-s-border bg-white px-1.5 py-px text-[12px] font-bold leading-none shadow-elevation-1">
          <svg viewBox="0 0 24 24" fill="#FFC32B" aria-hidden style={{ width: 9, height: 9 }}>
            <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.6 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
          </svg>
          {badge.rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
