"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ItemCard from "@/components/discovery/ItemCard";
import VideoCard from "@/components/discovery/VideoCard";
import Skeleton from "@/components/ui/Skeleton";
import type { DiscoveryItem } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEMO_DISCOVER_ITEMS } from "@/lib/demo-data";

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
        className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.14)] border border-[#EBEBEB] opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.18)] active:scale-[0.98] text-[#222222]"
        aria-label={t("scrollLeft")}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollRight}
        className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.14)] border border-[#EBEBEB] opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.18)] active:scale-[0.98] text-[#222222]"
        aria-label={t("scrollRight")}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 md:px-12 pb-8 pt-4 hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 snap-center w-[44vw] max-w-[200px] aspect-[4/5] rounded-2xl">
              <Skeleton className="w-full h-full rounded-[16px]" />
            </div>
          ))
        ) : items.length === 0 ? (
          DEMO_DISCOVER_ITEMS.map((item, index) => {
            const isExpanded = activeIndex === index;
            return (
              <Link
                key={item.id}
                href={`/${locale}/discover`}
                className="shrink-0 snap-center group relative block w-[44vw] max-w-[200px] aspect-[4/5]"
              >
                <div className="w-full h-full rounded-[16px] overflow-hidden">
                  <ItemCard item={item as unknown as DiscoveryItem} isExpanded={isExpanded} />
                </div>
              </Link>
            );
          })
        ) : (
          items.map((item, index) => {
            const isExpanded = hoveredIndex !== null ? hoveredIndex === index : activeIndex === index;
            return (
              <Link
                href={`/${locale}/discover?id=${item.id}`}
                prefetch={false}
                key={item.id}
                className="shrink-0 snap-center group relative block w-[44vw] max-w-[200px] aspect-[4/5]"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="w-full h-full rounded-[16px] overflow-hidden">
                  {item.media_type === "tiktok" || item.tiktok_url ? (
                    <VideoCard item={item} isExpanded={isExpanded} />
                  ) : (
                    <ItemCard item={item} isExpanded={isExpanded} />
                  )}
                </div>
              </Link>
            );
          })
        )}

        {/* Final card: "Go to Entdecken" — clean monochrome */}
        <Link
          href={`/${locale}/discover`}
          className="shrink-0 snap-center group relative block w-[44vw] max-w-[200px] aspect-[4/5]"
        >
          <div className="w-full h-full rounded-[16px] overflow-hidden bg-[#F7F7F7] border border-[#EBEBEB] flex flex-col items-center justify-center p-6 text-center hover:border-[#CCCCCC] transition-colors duration-150">
            <div className="w-10 h-10 rounded-full bg-[#222222] text-white flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <h3 className="font-heading font-semibold text-[14px] text-[#222222] leading-tight">
              {t("browseAll")}
            </h3>
            <p className="text-[12px] font-body text-[#717171] mt-2">
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
