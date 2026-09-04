"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SalonCard } from "../homepage/SalonCard";
import { safeCategory } from "./_shared";

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
 * SalonVenuesNearby (2026-07-24 PORT, ref _overhaul/SalonVenuesNearbyOverhaul.tsx +
 * SalonCardOverhaul.tsx). Horizontal carousel of nearby salons (same category), now
 * built on the real homepage SalonCard (5:4 photo, rounded-[22px], heart, discount
 * pill gated > 0, name+star row) instead of a hand-rolled card, at a bigger width so
 * ~1.25 cards are visible per viewport (a quarter of the 2nd card peeking): card =
 * (100vw - 44px) / 1.25, gap = 12px. Native swipe on mobile + visible arrow buttons on
 * desktop. Arrows fade out when at the scroll boundary.
 *
 * Data: `/api/salons/by-category?cat={primaryCat}&limit=8` (existing V2-D52 endpoint,
 * unchanged). Excludes the current salon by id. The endpoint returns the street
 * `address` but no postal_code or price, so the card's Row 3 shows the address only.
 */
export function SalonVenuesNearby({
  cat,
  excludeId,
}: {
  cat: string;
  excludeId: string;
  /** No longer read directly, SalonCard derives its own locale via useLocale().
   *  Kept in the type so SalonDetailV3's existing `locale={locale}` call needs no change. */
  locale: string;
}) {
  const t = useTranslations("common");
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

  // Before the section enters the viewport, render the SKELETON as the observer's target, instead
  // of the `<section ref={sectionRef} aria-hidden />` (a ZERO-HEIGHT box) that used to sit here.
  //
  // AND A CORRECTION, kept because the wrong version of this note was briefly committed on
  // 2026-08-15: I first wrote that the zero-height anchor made this rail permanently invisible, on
  // the evidence that `visible` never flipped while the anchor sat at viewport top 422. That
  // conclusion was WRONG, and the discriminating test is what showed it: `document.hidden` is
  // `true` in the preview pane I was measuring in, and a fresh IntersectionObserver placed on a
  // fully on-screen 358x22 heading never fired there either. IntersectionObserver simply does not
  // deliver in a hidden pane, so nothing about the rail was proved. Same trap as the known rAF
  // throttling in that pane. The rail is NOT known to be broken in a real browser.
  //
  // The change is kept anyway, on its own smaller merits rather than a bug that was never
  // demonstrated: a zero-area target is a fragile thing to hand an IntersectionObserver, and using
  // the skeleton gives it a real box, removes the layout jump when the cards land, and deletes a
  // render state instead of adding one.
  if (!visible || loading) {
    return (
      <section ref={sectionRef}>
        {/* V3-D202 (A18): font-body → font-display + Scale B. */}
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Ähnliche Stores
        </h2>
        {/* mockup-ok: skeleton matches the ported card's own w-[calc((100vw-44px)/1.25)]
            + gap-3, so the loading state doesn't jump size once real cards land. */}
        <div className="mt-5 flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[calc((100vw-44px)/1.25)] shrink-0 animate-pulse rounded-[22px] bg-s-bg-sunken md:w-[300px] aspect-[5/4]"
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
        {/* V3-D202 (A18): font-body → font-display + Scale B. */}
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Ähnliche Stores
        </h2>
        {/* Desktop arrow buttons */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label={t("previous")}
            className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.94] active:duration-[80ms] active:ease-glide disabled:opacity-30"
          >
            <ChevronLeft size={16} strokeWidth={1.9} className="text-s-ink" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Nächste"
            className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.94] active:duration-[80ms] active:ease-glide disabled:opacity-30"
          >
            <ChevronRight size={16} strokeWidth={1.9} className="text-s-ink" />
          </button>
        </div>
      </div>

      {/* mockup-ok: real homepage SalonCard (ask 6: nearby-rail card grammar matches the
          homepage 1:1) at a bigger width so ~1.25 cards are visible (ask 5). address only
          (citySelected=true): the by-category endpoint returns no postal_code/price. */}
      <div
        ref={scrollRef}
        className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((s) => (
          <SalonCard
            key={s.id}
            slug={s.slug}
            salonId={s.id}
            name={s.name}
            rating={s.average_rating}
            reviewCount={s.review_count}
            category={safeCategory(s.categories)}
            photoUrl={s.cover_photo_url ?? undefined}
            discountPercent={s.last_minute_discount_percent ?? null}
            variant="availability"
            citySelected
            address={s.address ?? undefined}
            widthClassName="w-[calc((100vw-44px)/1.25)] md:w-[300px]"
          />
        ))}
      </div>
    </section>
  );
}
