"use client";

// Style/shape/material filtering was dropped here: the fetch moved to the plain
// /api/staff/{staffId}/profile route, which takes no filter params, so the old chips
// re-fetched the same unfiltered data on every tap and changed nothing on screen.

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import NailDesignCard from "./NailDesignCard";
import Spinner from "@/components-legacy/ui/Spinner";

interface PortfolioImage {
  id: string;
  image_url: string;
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

export default function TechPortfolio({ staffId, staffName, salonSlug, initialImages, limit }: TechPortfolioProps) {
  const t = useTranslations("nail_dashboard") as any;
  const [images, setImages] = useState<PortfolioImage[]>(initialImages ?? []);
  const [loading, setLoading] = useState(!initialImages);
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchImages = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/${staffId}/profile`);
      if (!res.ok) {
        console.error("[TechPortfolio] failed to load portfolio:", res.status);
        return;
      }
      const data = await res.json();
      const items: PortfolioImage[] = data.portfolio ?? [];

      if (append) {
        setImages((prev) => [...prev, ...items]);
      } else {
        setImages(items);
      }
      // The profile route has no cursor/pagination and caps at 30 rows, so there is
      // no way to know if more exist; treat every response as the full set.
      setHasMore(false);
    } catch (err) {
      console.error("[TechPortfolio] failed to load portfolio:", err);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  // Fetch on mount
  useEffect(() => {
    if (initialImages) return;
    setPage(1);
    pageRef.current = 1;
    fetchImages(1, false);
  }, [fetchImages, initialImages]);

  // Infinite scroll (only when no limit/preview mode)
  useEffect(() => {
    if (limit) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          setPage(nextPage);
          fetchImages(nextPage, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, limit, fetchImages]);

  return (
    <div>
      {/* Grid */}
      {images.length === 0 && !loading ? (
        <p className="text-sm text-s-ink/40 text-center py-8">
          {t("portfolio_empty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <NailDesignCard
              key={img.id}
              id={img.id}
              imageUrl={img.image_url}
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
