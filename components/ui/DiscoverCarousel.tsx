"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ItemCard from "@/components/discovery/ItemCard";
import VideoCard from "@/components/discovery/VideoCard";
import Skeleton from "@/components/ui/Skeleton";
import type { DiscoveryItem } from "@/lib/types";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

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
    async function loadItems() {
      try {
        // Fetch up to 30 items to give the algorithm/shuffling good variety
        const res = await fetch("/api/discovery/feed?limit=30");
        const json = await res.json();
        if (json.items && json.items.length > 0) {
          // Shuffle them so it's not the same ones every time
          const shuffled = shuffleArray(json.items as DiscoveryItem[]);
          setItems(shuffled.slice(0, 5)); // Take top 5 for the carousel
        }
      } catch (err) {
        console.error("Failed to fetch discover carousel items:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadItems();
  }, []);

  return (
    <div className="w-full relative py-8 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 md:px-12 pb-8 pt-4 hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading ? (
          // Skeletons matching the TikTok aspect ratio styling
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 snap-center w-[170px] h-[300px] md:w-[200px] md:h-[355px] rounded-[16px]">
              <Skeleton className="w-full h-full rounded-[16px]" />
            </div>
          ))
        ) : items.length > 0 ? (
          items.map((item, index) => (
            <Link
              href={`/${locale}/discover?id=${item.id}`}
              prefetch={false}
              key={item.id}
              className="shrink-0 snap-center group relative block w-[170px] h-[300px] md:w-[200px] md:h-[355px]"
            >
              {/* Dynamic Scaling based on Center position */}
              <div 
                className={`w-full h-full transition-all duration-300 origin-center transform 
                  ${activeIndex === index ? "scale-105 z-10 opacity-100" : "scale-[0.88] opacity-60 md:scale-[0.95] md:opacity-80"}
                `}
              >
                {item.media_type === "tiktok" || item.tiktok_url ? (
                  <VideoCard item={item} />
                ) : (
                  <ItemCard item={item} />
                )}
              </div>
            </Link>
          ))
        ) : null}

        {/* 11th item: "Go to Entdecken" card */}
        <Link
          href={`/${locale}/discover`}
          className="shrink-0 snap-center group relative block w-[170px] h-[300px] md:w-[200px] md:h-[355px]"
        >
          <div 
            className={`w-full h-full rounded-[16px] overflow-hidden bg-s-coral/10 dark:bg-s-coral/5 border-2 border-dashed border-s-coral/30 shadow-warm-sm transition-all duration-300 flex flex-col items-center justify-center p-6 text-center transform origin-center
              ${activeIndex === items.length ? "scale-105 z-10 opacity-100 border-s-coral" : "scale-[0.88] opacity-60 md:scale-[0.95] md:opacity-80"}
            `}
          >
            <div className={`w-12 h-12 rounded-full bg-s-coral text-white flex items-center justify-center mb-4 transition-transform ${activeIndex === items.length ? "scale-110" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
            <h3 className={`font-display text-xl leading-tight transition-colors ${activeIndex === items.length ? "text-s-coral" : "text-s-ink dark:text-s-dm-text"}`}>
              Alle entdecken
            </h3>
            <p className="text-xs font-body text-s-ink/60 dark:text-s-dm-text/60 mt-2">
              Lass dich von tausenden Styles inspirieren
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
