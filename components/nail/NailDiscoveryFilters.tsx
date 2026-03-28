"use client";

import { X } from "lucide-react";

interface NailDiscoveryFiltersProps {
  style: string | null;
  shape: string | null;
  material: string | null;
  onStyleChange: (v: string | null) => void;
  onShapeChange: (v: string | null) => void;
  onMaterialChange: (v: string | null) => void;
}

const STYLES: { value: string; label: string }[] = [
  { value: "french", label: "French" },
  { value: "chrome", label: "Chrome" },
  { value: "3d_art", label: "3D Art" },
  { value: "ombre", label: "Ombré" },
  { value: "marble", label: "Marble" },
  { value: "minimal", label: "Minimal" },
  { value: "glitter", label: "Glitter" },
  { value: "abstract", label: "Abstract" },
  { value: "floral", label: "Floral" },
  { value: "geometric", label: "Geometric" },
  { value: "bridal", label: "Bridal" },
  { value: "matte", label: "Matte" },
];

const SHAPES: { value: string; label: string }[] = [
  { value: "almond", label: "Mandel" },
  { value: "coffin", label: "Coffin" },
  { value: "stiletto", label: "Stiletto" },
  { value: "oval", label: "Oval" },
  { value: "square", label: "Square" },
  { value: "round", label: "Rund" },
  { value: "squoval", label: "Squoval" },
];

const MATERIALS: { value: string; label: string }[] = [
  { value: "gel", label: "Gel" },
  { value: "acrylic", label: "Acryl" },
  { value: "dip_powder", label: "Dip Powder" },
  { value: "shellac", label: "Shellac" },
  { value: "polygel", label: "Polygel" },
];

export default function NailDiscoveryFilters({
  style, shape, material,
  onStyleChange, onShapeChange, onMaterialChange,
}: NailDiscoveryFiltersProps) {
  const hasAnyFilter = style || shape || material;

  return (
    <div className="space-y-3">
      {/* Style */}
      <FilterRow
        options={STYLES}
        value={style}
        onChange={(v) => onStyleChange(v === style ? null : v)}
      />
      {/* Shape */}
      <FilterRow
        options={SHAPES}
        value={shape}
        onChange={(v) => onShapeChange(v === shape ? null : v)}
      />
      {/* Material */}
      <FilterRow
        options={MATERIALS}
        value={material}
        onChange={(v) => onMaterialChange(v === material ? null : v)}
      />

      {hasAnyFilter && (
        <button
          onClick={() => { onStyleChange(null); onShapeChange(null); onMaterialChange(null); }}
          className="flex items-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral"
        >
          <X size={12} />
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}

function FilterRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {options.map((opt) => (
        <button
          key={opt.value}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`shrink-0 text-xs px-3 py-2 min-h-10 rounded-pill border transition-colors duration-150 ${
            value === opt.value
              ? "bg-s-coral text-white border-s-coral"
              : "bg-[--raised] dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border-s-ink/10 dark:border-s-dm-text/10 hover:border-s-coral/30"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
