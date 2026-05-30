import { LayoutDashboard, Image as ImageIcon, Hash } from "lucide-react";

/**
 * AssetPlaceholder — transitional scaffold marking where a REAL asset belongs.
 *
 * Used on /fuer-salons (B2B redesign, 2026-05-30) so the page never ships an
 * invented/stock image: each box states exactly what real asset to supply.
 * REMOVE each instance when the real screenshot / photo lands.
 *
 * Not a product primitive — page-scoped scaffolding, intentionally NOT in the
 * component registry. Layer: n/a (dev scaffold).
 *
 * variant:
 *   - "screenshot" → product UI (dashboard, calendar, CRM) · accent label
 *   - "photo"      → photography (salon, owner) · accent label
 *   - "data"       → a real-data figure that must NOT be invented · amber label
 */
type Variant = "screenshot" | "photo" | "data";

const HATCH: Record<Variant, string> = {
  screenshot:
    "repeating-linear-gradient(135deg,#FBFBFA,#FBFBFA 10px,#F4F5F3 10px,#F4F5F3 20px)",
  photo:
    "repeating-linear-gradient(135deg,#FBFBFA,#FBFBFA 10px,#F4F5F3 10px,#F4F5F3 20px)",
  data: "repeating-linear-gradient(135deg,#FFFDF8,#FFFDF8 10px,#FDF4E6 10px,#FDF4E6 20px)",
};

export function AssetPlaceholder({
  variant = "screenshot",
  label,
  desc,
  dim,
  className = "",
}: {
  variant?: Variant;
  label: string;
  desc: string;
  dim?: string;
  className?: string;
}) {
  const Icon = variant === "photo" ? ImageIcon : variant === "data" ? Hash : LayoutDashboard;
  const isData = variant === "data";
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed p-6 text-center ${
        isData ? "border-[#E3B778]" : "border-[#B7BEC9]"
      } ${className}`}
      style={{ background: HATCH[variant] }}
    >
      <span
        className={`inline-flex items-center gap-1.5 font-body text-[10.5px] font-bold uppercase tracking-[0.12em] ${
          isData ? "text-s-warning-text" : "text-s-accent"
        }`}
      >
        <Icon size={14} strokeWidth={2} aria-hidden />
        {label}
      </span>
      <span className="max-w-[340px] font-body text-[13px] font-normal leading-[1.45] text-s-ink">
        {desc}
      </span>
      {dim ? (
        <span className="font-mono text-[11px] text-[#9AA0AA]">{dim}</span>
      ) : null}
    </div>
  );
}
