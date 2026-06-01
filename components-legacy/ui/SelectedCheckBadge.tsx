import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SelectedCheckBadge — V3-D421 (2026-06-01). The ONE universal "selected" marker
 * for every staff / barber picker (CANON.md §6).
 *
 * Drop it inside an avatar's `relative` wrapper; it renders only when `selected`.
 * Ink circle (`bg-s-ink`) + white check, anchored bottom-right with a 2px white
 * border so it reads off any photo. The avatar itself stays full and UNCOVERED,
 * because you are choosing a person and the face is the content. This supersedes
 * the old per-picker treatments (ink ring / ink border / dark photo-overlay).
 *
 * Layer: 1 (chrome, selection affordance).
 */
export function SelectedCheckBadge({
  selected,
  size = 22,
  className,
}: {
  selected: boolean;
  size?: number;
  className?: string;
}) {
  if (!selected) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -bottom-1 -right-1 z-[2] grid place-items-center rounded-full border-2 border-white bg-s-ink",
        className,
      )}
      style={{ height: size, width: size }}
    >
      <Check size={Math.round(size * 0.55)} strokeWidth={3} className="text-white" />
    </span>
  );
}
