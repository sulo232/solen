"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { DiscoveryItem } from "@/lib/types";

interface SavedStyle {
  item: DiscoveryItem;
  similar: DiscoveryItem[];
}

export default function ForYouSection() {
  const [sections, setSections] = useState<SavedStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    const fetchForYou = async () => {
      try {
        // Fetch user's last 3 saved items
        const savesRes = await fetch("/api/discovery/saves?limit=3");
        if (!savesRes.ok) { setLoading(false); return; }
        const savesData = await savesRes.json();
        const savedItems: DiscoveryItem[] = savesData.items ?? [];

        if (savedItems.length === 0) { setLoading(false); return; }

        // For each saved item, fetch similar
        const results: SavedStyle[] = [];
        for (const item of savedItems) {
          const simRes = await fetch(`/api/discovery/similar?item_id=${item.id}&limit=4`);
          if (!simRes.ok) continue;
          const simData = await simRes.json();
          if ((simData.items ?? []).length > 0) {
            results.push({ item, similar: simData.items });
          }
        }
        setSections(results);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchForYou();
  }, []);

  if (!loading && sections.length === 0) return null;

  if (loading) {
    return (
      <div className="mb-6 space-y-4">
        <div className="h-4 bg-s-ink/5 dark:bg-white/5 rounded-pill w-48 animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-shrink-0 w-40 aspect-[3/4] rounded-card bg-s-bg-sunken dark:bg-s-dm-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-6">
      {sections.map(({ item, similar }) => (
        <div key={item.id}>
          <div className="mb-4 flex items-center gap-2">
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 dark:text-s-dm-text/30">
              {locale === "de"
                ? `Weil du „${item.style_name || item.category}" gespeichert hast`
                : `Because you saved "${item.style_name || item.category}"`}
            </p>
            <div className="flex-1 h-px bg-s-ink/[0.05] dark:bg-white/[0.05]" />
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
            {similar.map((sim) => (
              <div
                key={sim.id}
                onClick={() => router.push(`/${locale}/discover/${sim.id}`)}
                className="w-32 shrink-0 snap-start rounded-card overflow-hidden bg-white dark:bg-s-dm-surface border border-s-ink/[0.06] dark:border-white/[0.05] cursor-pointer hover:shadow-warm-lg hover:-translate-y-[5px] transition-all duration-250"
              >
                <div className="aspect-[3/4] relative bg-s-ink/5 dark:bg-white/5">
                  {(sim.image_url || sim.tiktok_thumbnail_url) && (
                    <Image
                      src={sim.image_url || sim.tiktok_thumbnail_url!}
                      alt={sim.style_name || ""}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-medium text-s-ink dark:text-s-dm-text truncate">
                    {sim.style_name || sim.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
