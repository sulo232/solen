// exists-check: net-new vs app/[locale]/_components/salon/StatusInline.tsx (real, unmodified).
// `npm run exists` (2026-07-24) confirms StatusInline is the single open/closed inline chip.
// GATE-FORCED DEVIATION from the research's primary fix: the research's LOCKFILE-cited literal
// for this surface fails the live muted-color-gate (too dark/saturated to count as vivid,
// "owner 2026-07-06, repeat: using muted color AGAIN"). Per precedence (gates outrank frozen
// literals), this uses the research's own documented ALTERNATIVE instead: the `s-success` token
// (#16A34A), the SAME green already used elsewhere on this PDP (discount pill, paid-products
// note), so this also satisfies the literal ask to "unify every divergent green".
// Needs owner sign-off per the research note (it collapses the two-token open/success split);
// flagged in the page footnote.
import { cn } from "@/lib/utils";

export function StatusInlineOverhaul({
  isOpen,
  label,
  size = "md",
}: {
  isOpen: boolean;
  label: string;
  /** "sm" = 13px, "md" = 15px (default), "lg" = 16px (matches Fresha) */
  size?: "sm" | "md" | "lg";
}) {
  // Owner decision 2026-07-24 ("why is there like closed and beside it gonna
  // open... I don't want that"): render ONLY the status word, drop the
  // trailing "opens on <day> at <time>" / "closes at <time>" clause entirely.
  // Exact hours still live in the opening-hours section below, so no
  // information is lost.
  const [head] = label.split(" ");
  const sizeCls = size === "sm" ? "text-[13px]" : size === "lg" ? "text-[16px]" : "text-[15px]";
  return (
    <span
      className={cn(
        "font-body inline-block font-semibold",
        sizeCls,
        isOpen ? "text-s-success" : "text-s-closed"
      )}
    >
      {head}
    </span>
  );
}
