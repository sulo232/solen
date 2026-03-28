"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { DiscoveryItem } from "@/lib/types";

interface SimilarStylesProps {
  itemId: string;
  category: string;
  tags: string[];
}

const HEADING: Record<string, string> = {
  de: "Das könnte dir auch gefallen",
  en: "You might also like",
  fr: "Vous pourriez aussi aimer",
  it: "Potrebbe piacerti anche",
};

export default function SimilarStyles({ itemId, category, tags }: SimilarStylesProps) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;
    const fetchSimilar = async () => {
      try {
        const res = await fetch(`/api/discovery/similar?item_id=${itemId}&limit=6`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setItems(data.items ?? []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchSimilar();
    return () => { cancelled = true; };
  }, [itemId]);

  if (!loading && items.length === 0) return null;

  return (
    <div className="mt-6 px-1">
      <h3 className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-3">
        {HEADING[locale] ?? HEADING.en}
      </h3>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-hide">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-32 shrink-0 snap-start rounded-[16px] overflow-hidden bg-[--raised] dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5">
              <div className="aspect-[3/4] bg-s-ink/5 dark:bg-white/5 shimmer" />
              <div className="p-2 space-y-1">
                <div className="h-2.5 bg-s-ink/5 dark:bg-white/5 rounded-pill w-3/4 shimmer" />
              </div>
            </div>
          ))
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/${locale}/discover/${item.id}`)}
              className="w-32 shrink-0 snap-start rounded-[16px] overflow-hidden bg-[--raised] dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 cursor-pointer hover:shadow-warm-lg hover:-translate-y-[5px] transition-[transform,box-shadow] duration-[250ms]"
            >
              <div className="aspect-[3/4] relative bg-s-ink/5 dark:bg-white/5">
                {(item.image_url || item.tiktok_thumbnail_url) && (
                  <Image
                    src={item.image_url || item.tiktok_thumbnail_url!}
                    alt={item.style_name || ""}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-medium text-s-ink dark:text-s-dm-text truncate">
                  {item.style_name || item.category}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
