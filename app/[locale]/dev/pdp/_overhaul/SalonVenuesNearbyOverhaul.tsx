"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonVenuesNearby.tsx (real,
// unmodified). `npm run exists` confirmed the real /api/salons/by-category endpoint (unchanged,
// used as-is here) and the canonical homepage SalonCard (copied to SalonCardOverhaul.tsx in this
// same folder, see that file's header for why a copy was needed). This file is a copy of the
// real rail shell (IntersectionObserver deferred fetch + scroll/arrow logic + heading) with the
// hand-rolled card markup replaced by SalonCardOverhaul (ask 6: card grammar matches the
// homepage) at a bigger width (ask 5: ~1.25 cards visible at 390px).

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SalonCardOverhaul } from "./SalonCardOverhaul";
import { safeCategory } from "../../../_components/salon/_shared";

interface NearbyVenue {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  average_rating: number;
  review_count?: number;
  categories?: string[];
  address?: string | null;
  last_minute_discount_percent?: number | null;
}

/**
 * SalonVenuesNearbyOverhaul , mockup copy of the real SalonVenuesNearby. Data source is the
 * REAL live `/api/salons/by-category` endpoint (untouched). WIDTH MATH (research spec, exact):
 * card = (100vw - 44px) / 1.25, gap = 12px (gap-3) , at 390px that is a 276.8px card, leaving a
 * 69.2px / 25% peek of the second card. The API does not return postal_code or price (confirmed
 * live in route.ts), so Row 3 renders the street address only and no price line , that gap is a
 * documented backend delta in the research spec (enhance-not-block), not a fabricated value.
 */
export function SalonVenuesNearbyOverhaul({
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
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
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

  if (!visible) {
    return <section ref={sectionRef} aria-hidden />;
  }

  if (loading) {
    return (
      <section ref={sectionRef}>
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Nearby
        </h2>
        <div className="mt-5 flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[calc((100vw-44px)/1.25)] md:w-[300px] shrink-0 aspect-[5/4] animate-pulse rounded-[22px] bg-s-bg-sunken"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section ref={sectionRef}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Nearby
        </h2>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous"
            className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-opacity hover:bg-s-bg-sunken disabled:opacity-30"
          >
            <ChevronLeft size={16} className="text-s-ink" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Next"
            className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-opacity hover:bg-s-bg-sunken disabled:opacity-30"
          >
            <ChevronRight size={16} className="text-s-ink" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((s) => (
          <SalonCardOverhaul
            key={s.id}
            slug={s.slug}
            salonId={s.id}
            name={s.name}
            rating={s.average_rating}
            category={safeCategory(s.categories)}
            photoUrl={s.cover_photo_url ?? undefined}
            discountPercent={s.last_minute_discount_percent ?? null}
            address={s.address ?? undefined}
            widthClassName="w-[calc((100vw-44px)/1.25)] md:w-[300px]"
          />
        ))}
      </div>
    </section>
  );
}
