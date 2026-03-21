"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import NailDesignCard from "./NailDesignCard";
import Spinner from "@/components/ui/Spinner";
import type { NailStyleCategory, NailShape, NailMaterial } from "@/lib/types";

interface PortfolioImage {
  id: string;
  image_url: string;
  nail_style?: NailStyleCategory | null;
  nail_shape?: NailShape | null;
  nail_material?: NailMaterial | null;
  caption?: string | null;
  sort_order: number;
}

interface TechPortfolioProps {
  staffId: string;
  staffName: string;
  salonSlug?: string;
  /** Pre-fetched images (skip API call) */
  initialImages?: PortfolioImage[];
  /** Max items to show (for preview mode on salon page) */
  limit?: number;
}

const STYLE_FILTERS: { value: NailStyleCategory; label: string }[] = [
  { value: "french", label: "French" },
  { value: "chrome", label: "Chrome" },
  { value: "3d_art", label: "3D Art" },
  { value: "ombre", label: "Ombré" },
  { value: "marble", label: "Marble" },
  { value: "glitter", label: "Glitter" },
  { value: "minimal", label: "Minimal" },
  { value: "abstract", label: "Abstract" },
  { value: "floral", label: "Floral" },
  { value: "bridal", label: "Bridal" },
];

const SHAPE_FILTERS: { value: NailShape; label: string }[] = [
  { value: "almond", label: "Mandel" },
  { value: "coffin", label: "Coffin" },
  { value: "stiletto", label: "Stiletto" },
  { value: "oval", label: "Oval" },
  { value: "square", label: "Square" },
  { value: "round", label: "Rund" },
];

const MATERIAL_FILTERS: { value: NailMaterial; label: string }[] = [
  { value: "gel", label: "Gel" },
  { value: "acrylic", label: "Acryl" },
  { value: "dip_powder", label: "Dip Powder" },
  { value: "shellac", label: "Shellac" },
];

export default function TechPortfolio({ staffId, staffName, salonSlug, initialImages, limit }: TechPortfolioProps) {
  const [images, setImages] = useState<PortfolioImage[]>(initialImages ?? []);
  const [loading, setLoading] = useState(!initialImages);
  const [filterStyle, setFilterStyle] = useState<NailStyleCategory | null>(null);
  const [filterShape, setFilterShape] = useState<NailShape | null>(null);
  const [filterMaterial, setFilterMaterial] = useState<NailMaterial | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchImages = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(limit ?? 20) });
      if (filterStyle) params.set("nail_style", filterStyle);
      if (filterShape) params.set("nail_shape", filterShape);
      if (filterMaterial) params.set("nail_material", filterMaterial);

      const res = await fetch(`/api/nail-tech/${staffId}/portfolio?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const items: PortfolioImage[] = data.images ?? [];

      if (append) {
        setImages((prev) => [...prev, ...items]);
      } else {
        setImages(items);
      }
      setHasMore(items.length >= (limit ?? 20));
    } finally {
      setLoading(false);
    }
  }, [staffId, filterStyle, filterShape, filterMaterial, limit]);

  // Fetch on mount or filter change
  useEffect(() => {
    if (initialImages && !filterStyle && !filterShape && !filterMaterial) return;
    setPage(1);
    fetchImages(1, false);
  }, [fetchImages, initialImages, filterStyle, filterShape, filterMaterial]);

  // Infinite scroll (only when no limit/preview mode)
  useEffect(() => {
    if (limit) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchImages(nextPage, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, hasMore, loading, limit, fetchImages]);

  const showFilters = !limit;

  return (
    <div>
      {/* Filter pills */}
      {showFilters && (
        <div className="mb-4 space-y-2">
          <FilterRow
            label="Style"
            options={STYLE_FILTERS}
            value={filterStyle}
            onChange={(v) => setFilterStyle(v === filterStyle ? null : v)}
          />
          <FilterRow
            label="Form"
            options={SHAPE_FILTERS}
            value={filterShape}
            onChange={(v) => setFilterShape(v === filterShape ? null : v)}
          />
          <FilterRow
            label="Material"
            options={MATERIAL_FILTERS}
            value={filterMaterial}
            onChange={(v) => setFilterMaterial(v === filterMaterial ? null : v)}
          />
        </div>
      )}

      {/* Grid */}
      {images.length === 0 && !loading ? (
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 text-center py-8">
          Noch keine Designs im Portfolio
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <NailDesignCard
              key={img.id}
              id={img.id}
              imageUrl={img.image_url}
              style={img.nail_style}
              shape={img.nail_shape}
              material={img.nail_material}
              staffName={staffName}
              showBookCta={!!salonSlug}
              bookingUrl={salonSlug ? `/${salonSlug}?staffId=${staffId}` : undefined}
            />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {!limit && hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}

// ─── Filter Row ───────────────────────────────

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <span className="text-[10px] uppercase tracking-wider text-s-ink/40 dark:text-s-dm-text/40 shrink-0">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`shrink-0 text-xs px-3 py-1 rounded-pill border transition-colors ${
            value === opt.value
              ? "bg-s-coral text-white border-s-coral"
              : "bg-white dark:bg-s-dm-surface text-s-ink/70 dark:text-s-dm-text/70 border-s-ink/10 dark:border-s-dm-text/10 hover:border-s-coral/30"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
