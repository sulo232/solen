/**
 * StatusInline — V3-D232 (2026-05-27, extracted from SalonSidebar for reuse).
 *
 * Split-color inline open/closed status. Word in s-success/s-urgency,
 * time detail in muted ink. Replaces StatusPill in surfaces where the
 * pill chrome (background + radius) is too heavy (Fresha pattern —
 * inline text, no pill).
 *
 * Per Fresha capture (les-mains-basel @ 1440):
 *   "Closed" word in `#B7570B` burnt amber (we map → `s-urgency`)
 *   "- opens at 10:00 AM" continuation in `#767676` muted ink (we map → `s-ink-2`)
 *
 * label from computeOpenStatus is one of:
 *   "Geöffnet · Schliesst um HH:MM"
 *   "Geschlossen · Öffnet HH:MM"
 *   "Geschlossen · Öffnet Mittwoch um 09:00"
 * Split on the first " · " to isolate the leading word.
 *
 * Layer 3 semantic UI (color carries meaning — universal-color convention:
 * success=green, warning/urgency=amber).
 */
import { cn } from "@/lib/utils";

export function StatusInline({
  isOpen,
  label,
  size = "md",
}: {
  isOpen: boolean;
  label: string;
  /** "sm" = 13px, "md" = 15px (default), "lg" = 16px (matches Fresha) */
  size?: "sm" | "md" | "lg";
}) {
  const [head, ...rest] = label.split(" · ");
  const tail = rest.length > 0 ? " · " + rest.join(" · ") : "";
  const sizeCls = size === "sm" ? "text-[13px]" : size === "lg" ? "text-[16px]" : "text-[15px]";
  return (
    <span className={cn("font-body inline-flex items-baseline gap-1", sizeCls)}>
      <span className={cn("font-semibold", isOpen ? "text-s-success" : "text-s-urgency")}>
        {head}
      </span>
      {tail && <span className="text-s-ink-2 font-normal">{tail}</span>}
    </span>
  );
}
