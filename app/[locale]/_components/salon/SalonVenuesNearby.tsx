"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { capitalize } from "./_shared";

interface NearbyVenue {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  average_rating: number;
  review_count?: number;
  categories?: string[];
}

/**
 * SalonVenuesNearby — V2-D53.3 (2026-05-11).
 *
 * Horizontal carousel of nearby salons (same category). Native swipe on
 * mobile + visible arrow buttons on desktop. Arrows fade out when at the
 * scroll boundary.
 *
 * Data: `/api/salons/by-category?cat={primaryCat}&limit=8` (existing
 * V2-D52 endpoint). Excludes the current salon by id.
 */
export function SalonVenuesNearby({
  cat,
  excludeId,
  locale,
}: {
  cat: string;
  excludeId: string;
  locale: string;
}) {
  const [items, setItems] = React.useState<NearbyVenue[]>([]);
  const [loading, setLoading] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetch(`/api/salons/by-category?cat=${cat}&limit=8`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        setItems(
          (d.items ?? [])
            .filter((s: { id: string }) => s.id !== excludeId)
            .slice(0, 8)
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => ac.abort();
  }, [cat, excludeId]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = el.clientWidth * 0.8 * (dir === "right" ? 1 : -1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section>
        <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
          In der Nähe
        </h2>
        <div className="mt-5 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] w-[220px] shrink-0 animate-pulse rounded-2xl bg-s-bg-sunken" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
          In der Nähe
        </h2>
        {/* Desktop arrow buttons */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Vorherige"
            className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-opacity hover:bg-s-bg-sunken disabled:opacity-30"
          >
            <ChevronLeft size={16} className="text-s-ink" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Nächste"
            className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-opacity hover:bg-s-bg-sunken disabled:opacity-30"
          >
            <ChevronRight size={16} className="text-s-ink" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="-mx-4 mt-5 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0"
      >
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/${locale}/salon/${s.slug}`}
            className="font-body group flex w-[220px] shrink-0 flex-col snap-start md:w-[260px]"
          >
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-s-bg-sunken">
              {s.cover_photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.cover_photo_url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              )}
            </div>
            <div className="mt-3">
              <div className="truncate text-[14px] font-semibold text-s-ink md:text-[15px]">
                {s.name}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[12px] text-s-ink-3">
                <Star size={11} fill="#F3A864" stroke="none" />
                <span>{s.average_rating?.toFixed(1) ?? "—"}</span>
                {s.review_count !== undefined && <span>({s.review_count})</span>}
              </div>
              {s.categories?.[0] && (
                <div className="mt-1 text-[11px] uppercase tracking-[0.04em] text-s-ink-3">
                  {capitalize(s.categories[0])}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
