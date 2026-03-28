"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ItemCard from "@/components/discovery/ItemCard";
import VideoCard from "@/components/discovery/VideoCard";
import Skeleton from "@/components/ui/Skeleton";
import type { DiscoveryItem } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function DiscoverCarousel({ locale }: { locale: string }) {
  const t = useTranslations("home.discover");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    // Scroll listener to find the item strictly in the center
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      const center = container.scrollLeft + container.clientWidth / 2;
      let closestIdx = 0;
      let minDistance = Infinity;

      // Children are the skeleton / real cards
      Array.from(container.children).forEach((child, i) => {
        const childElement = child as HTMLElement;
        const childCenter = childElement.offsetLeft + childElement.clientWidth / 2;
        const dist = Math.abs(childCenter - center);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });
      setActiveIndex(closestIdx);
    };

    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      // Trigger once on mount / load
      handleScroll();
    }
    return () => {
      if (el) el.removeEventListener("scroll", handleScroll);
    };
  }, [items, isLoading]);

  useEffect(() => {
    let cancelled = false;
    async function loadItems() {
      try {
        const res = await fetch("/api/discovery/feed?limit=30");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.items && json.items.length > 0) {
          setItems((json.items as DiscoveryItem[]).slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch discover carousel items:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadItems();
    return () => { cancelled = true; };
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
  };

  return (
    <div className="w-full relative py-8 overflow-hidden group">
      {/* Scroll controls (Desktop only) */}
      <button
        onClick={scrollLeft}
        className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-s-dm-raised/90 rounded-pill items-center justify-center shadow-warm-lg border border-s-ink/5 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-[opacity,transform,filter] duration-150 z-20 hover:brightness-[1.06] active:scale-[0.98] text-s-ink dark:text-white"
        aria-label={t("scrollLeft")}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={scrollRight}
        className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-s-dm-raised/90 rounded-pill items-center justify-center shadow-warm-lg border border-s-ink/5 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-[opacity,transform,filter] duration-150 z-20 hover:brightness-[1.06] active:scale-[0.98] text-s-ink dark:text-white"
        aria-label={t("scrollRight")}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 md:px-12 pb-8 pt-4 hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading ? (
          // Skeletons matching the TikTok aspect ratio styling
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 snap-center w-[155px] h-[275px] md:w-[200px] md:h-[355px] rounded-[16px]">
              <Skeleton className="w-full h-full rounded-[16px]" />
            </div>
          ))
        ) : items.length > 0 ? (
          items.map((item, index) => {
            const isExpanded = hoveredIndex !== null ? hoveredIndex === index : activeIndex === index;
            return (
              <Link
                href={`/${locale}/discover?id=${item.id}`}
                prefetch={false}
                key={item.id}
                className="shrink-0 snap-center group relative block w-[155px] h-[275px] md:w-[200px] md:h-[355px]"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Dynamic Scaling based on Center or Hover position */}
                <div
                  className={`w-full h-full rounded-[16px] overflow-hidden transition-[transform,opacity] duration-[250ms] origin-center transform
                    ${isExpanded ? "scale-[1.03] z-10 opacity-100" : "scale-[0.88] opacity-60 md:scale-[0.95] md:opacity-80"}
                  `}
                >
                  {item.media_type === "tiktok" || item.tiktok_url ? (
                    <VideoCard item={item} isExpanded={isExpanded} />
                  ) : (
                    <ItemCard item={item} isExpanded={isExpanded} />
                  )}
                </div>
              </Link>
            );
          })
        ) : null}

        {/* 11th item: "Go to Entdecken" card */}
        <Link
          href={`/${locale}/discover`}
          className="shrink-0 snap-center group relative block w-[155px] h-[275px] md:w-[200px] md:h-[355px]"
        >
          <div
            className={`w-full h-full rounded-[16px] overflow-hidden bg-s-coral/10 dark:bg-s-coral/5 border-2 border-dashed border-s-coral/30 shadow-warm-sm transition-[transform,opacity,border-color] duration-[250ms] flex flex-col items-center justify-center p-6 text-center transform origin-center
              ${activeIndex === items.length ? "scale-105 z-10 opacity-100 border-s-coral" : "scale-[0.88] opacity-60 md:scale-[0.95] md:opacity-80"}
            `}
          >
            <div className={`w-12 h-12 rounded-full bg-s-coral text-white flex items-center justify-center mb-4 transition-transform ${activeIndex === items.length ? "scale-110" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <h3 className={`font-display text-xl leading-tight transition-colors duration-150 ${activeIndex === items.length ? "text-s-coral" : "text-s-ink dark:text-s-dm-text"}`}>
              {t("browseAll")}
            </h3>
            <p className="text-xs font-body text-s-ink/60 dark:text-s-dm-text/60 mt-2">
              {t("inspirationText")}
            </p>
          </div>
        </Link>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
