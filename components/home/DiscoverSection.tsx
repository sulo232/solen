"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import SectionCarousel from "@/components/home/SectionCarousel";

/**
 * DiscoverSection — Q51 (locked 2026-05-02) home section #4 (Discover —
 * Pinterest+booking-bridge).
 *
 * Pulls from `/api/discovery/feed` (existing endpoint). Renders inspiration
 * tiles in a scroll-snap carousel — each tile is an image-led card linking
 * to either a salon detail page (booking-bridge) or to the discovery item's
 * own deep page if it has one.
 *
 * Hidden if no discovery items are published.
 *
 * v1 anatomy is simple — square photo + Anton title + sub-line. Future v2
 * (Phase 7+) adds the full Pinterest-mixed-card-sizes pattern; for now,
 * uniform 1:1 tiles match Q26 card grammar and avoid layout-shift surprises.
 */
interface DiscoveryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_salon_slug: string | null;
  category: string | null;
}

export default function DiscoverSection() {
  const locale = useLocale();
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discovery/feed?limit=10", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const arr = data?.items ?? data?.discovery_items ?? data ?? [];
        setItems(Array.isArray(arr) ? arr : []);
      })
      .catch((err) => console.error("[DiscoverSection] /api/discovery/feed:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <SectionCarousel
      eyebrow="Inspiration"
      headline="Entdecke"
      seeAllHref="/entdecken"
    >
      {items.map((item) => {
        const href = item.link_salon_slug
          ? `/${locale}/salon/${item.link_salon_slug}`
          : `/${locale}/entdecken#${item.id}`;
        return (
          <Link
            key={item.id}
            href={href}
            className="snap-start shrink-0 w-[42vw] sm:w-[28vw] md:w-[22vw] lg:w-[19vw] max-w-[260px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 rounded-[14px]"
          >
            {/* Square photo per Q26 */}
            <div className="relative aspect-square rounded-[14px] overflow-hidden bg-s-bg-sunken">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 22vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-heading text-2xl text-s-ink/20 uppercase">
                  {item.title[0]}
                </div>
              )}
              {item.category && (
                <span className="absolute top-2 left-2 inline-flex items-center px-2 py-[3px] rounded-full bg-white/90 backdrop-blur-sm font-body text-[9px] font-bold uppercase tracking-[.14em] text-s-coral-text">
                  {item.category}
                </span>
              )}
            </div>
            <h3 className="mt-2 font-heading text-[14px] sm:text-[16px] text-s-ink uppercase leading-[1.05] line-clamp-2" style={{ letterSpacing: "0.01em" }}>
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-1 font-body text-[11px] text-s-ink/55 leading-[1.4] line-clamp-2">
                {item.description}
              </p>
            )}
          </Link>
        );
      })}
    </SectionCarousel>
  );
}
