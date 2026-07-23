"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RatingStars } from "../primitives";
import { capitalize } from "./_shared";

interface NearbyVenue {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  average_rating: number;
  review_count?: number;
  categories?: string[];
  address?: string | null;
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
  const sectionRef = React.useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  // Track whether the section has entered the viewport to defer the fetch.
  const [visible, setVisible] = React.useState(false);

  // Defer the API fetch until the section scrolls near the viewport.
  // rootMargin 200px fires while still below the fold so there is no
  // perceived delay when the user reaches the rail.
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      // Fallback for very old browsers: fetch immediately.
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visible) return;
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
  }, [visible, cat, excludeId]);

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

  // Before the section enters the viewport, render only the anchor element
  // so the IntersectionObserver has a target without triggering the API fetch.
  if (!visible) {
    return <section ref={sectionRef} aria-hidden />;
  }

  if (loading) {
    return (
      <section ref={sectionRef}>
        {/* V3-D202 (A18): font-body → font-display + Scale B. */}
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          In der Nähe
        </h2>
        <div className="mt-5 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] w-[calc(66%-12px)] shrink-0 animate-pulse rounded-2xl bg-s-bg-sunken" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section ref={sectionRef}>
      <div className="flex items-center justify-between">
        {/* V3-D202 (A18): font-body → font-display + Scale B. */}
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
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
        className="mt-5 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/${locale}/salon/${s.slug}`}
            className="font-body group flex w-[calc(66%-12px)] shrink-0 flex-col snap-start md:w-[260px]"
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
            {/* Fresha card meta (pdp-bottom capture): name 16/600, grey ADDRESS line,
                sentence-case type · rating. No uppercase tags. */}
            <div className="mt-2.5">
              <div className="truncate text-[16px] font-semibold text-s-ink">
                {s.name}
              </div>
              {s.address && (
                <div className="mt-0.5 truncate text-[13px] text-s-ink-3">{s.address}</div>
              )}
              {s.categories?.[0] && (
                <div className="mt-0.5 text-[13px] text-s-ink-3">
                  {capitalize(s.categories[0])}
                </div>
              )}
              <div className="mt-1 text-[13px] text-s-ink-3">
                {s.average_rating != null ? (
                  <RatingStars value={s.average_rating} count={s.review_count} size="sm" />
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
